import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthService } from "../../auth/auth.service";
import { AuditService } from "../../common/audit.service";
import { currentContext, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toAppUser } from "../../common/shapes";
import { webOrigins } from "../../config/env";
import type { InviteUserDto } from "./dto/invite-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  /** getUsers: everyone with a login at this school. */
  async list() {
    const members = await this.prisma.tenant.member.findMany({ include: { user: true }, orderBy: { createdAt: "asc" } });
    return members.map((m) => toAppUser(m, m.user));
  }

  /**
   * inviteUser: gives someone a login at this school. New people get an email link to set
   * their password; someone who already uses DeepDev at another school is simply added.
   */
  async invite(body: InviteUserDto) {
    const tenantId = requireTenantId();
    const email = body.email.trim().toLowerCase();
    const sys = this.prisma.system; // Logins live in the auth tables, shared across schools.
    const existing = await sys.user.findUnique({ where: { email } });
    if (existing && (await sys.member.findFirst({ where: { organizationId: tenantId, userId: existing.id } }))) throw fail(409, `${email} already has an account`);
    if (body.branchIds.length) {
      const known = await this.prisma.tenant.branch.count({ where: { id: { in: body.branchIds } } });
      if (known !== body.branchIds.length) throw fail(400, "Choose campuses from this school");
    }
    const user = existing ?? (await sys.user.create({ data: { id: randomUUID(), name: body.name.trim(), email, emailVerified: false } }));
    const member = await sys.member.create({
      data: {
        id: randomUUID(),
        organizationId: tenantId,
        userId: user.id,
        role: body.role,
        title: body.title?.trim() ?? "",
        branchIds: body.branchIds,
        staffId: body.staffId,
        status: existing ? "active" : "invited",
      },
    });
    if (!existing) await this.authService.auth.api.requestPasswordReset({ body: { email, redirectTo: `${webOrigins[0]}/reset-password` } });
    await this.audit.record("user.invited", "member", member.id, { email, role: body.role });
    return toAppUser(member, user);
  }

  /** setUserStatus: turn someone's access off or back on. */
  async setStatus(id: string, status: "active" | "disabled") {
    const member = await this.prisma.tenant.member.findFirst({ where: { userId: id } });
    if (!member) throw fail(404, "User not found");
    if (member.role === "owner" && status === "disabled") throw fail(400, "The owner's access can't be turned off");
    if (id === currentContext().userId && status === "disabled") throw fail(400, "You can't turn off your own access");
    await this.prisma.tenant.member.update({ where: { id: member.id }, data: { status } });
    await this.audit.record(`user.${status === "disabled" ? "disabled" : "enabled"}`, "member", member.id);
    return null;
  }
}
