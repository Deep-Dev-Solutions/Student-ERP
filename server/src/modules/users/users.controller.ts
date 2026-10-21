import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";
import { AuthService } from "../../auth/auth.service";
import { AuditService } from "../../common/audit.service";
import { currentContext, requireTenantId } from "../../common/context";
import { RequirePermission } from "../../common/decorators";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toAppUser } from "../../common/shapes";
import { webOrigins } from "../../config/env";

const SCHOOL_ROLES = ["owner", "branch_admin", "accountant", "front_desk", "teacher"] as const;

class InviteUserDto {
  @IsString() @Length(3, 80) name!: string;
  @IsEmail({}, { message: "Enter a valid email address" }) email!: string;
  @IsIn(SCHOOL_ROLES.filter((r) => r !== "owner"), { message: "Choose a role" }) role!: string;
  @IsOptional() @IsString() @Length(0, 80) title?: string;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) branchIds!: string[];
  @IsOptional() @IsString() staffId?: string;
}
class UserStatusDto {
  @IsIn(["active", "disabled"]) status!: "active" | "disabled";
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  /** getUsers: everyone with a login at this school. */
  @Get()
  async list() {
    const members = await this.prisma.tenant.member.findMany({ include: { user: true }, orderBy: { createdAt: "asc" } });
    return members.map((m) => toAppUser(m, m.user));
  }

  /**
   * inviteUser: gives someone a login at this school. New people get an email link to set
   * their password; someone who already uses DeepDev at another school is simply added.
   */
  @RequirePermission("adm_system_settings")
  @Post()
  async invite(@Body() body: InviteUserDto) {
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
  @RequirePermission("adm_system_settings")
  @Patch(":id/status")
  async setStatus(@Param("id") id: string, @Body() body: UserStatusDto) {
    const member = await this.prisma.tenant.member.findFirst({ where: { userId: id } });
    if (!member) throw fail(404, "User not found");
    if (member.role === "owner" && body.status === "disabled") throw fail(400, "The owner's access can't be turned off");
    if (id === currentContext().userId && body.status === "disabled") throw fail(400, "You can't turn off your own access");
    await this.prisma.tenant.member.update({ where: { id: member.id }, data: { status: body.status } });
    await this.audit.record(`user.${body.status === "disabled" ? "disabled" : "enabled"}`, "member", member.id);
    return null;
  }
}
