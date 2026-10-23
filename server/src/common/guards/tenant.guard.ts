import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { currentContext } from "../context";
import { NO_TENANT_KEY, PUBLIC_KEY } from "../decorators";
import { fail } from "../errors";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthedRequest } from "./auth.guard";

/**
 * 2. Resolves the school for this request: the session's active school, or the
 * caller's first membership. Refuses disabled members and suspended schools.
 * A platform admin "viewing as owner" is impersonating the owner, so they arrive
 * here as that owner.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(NO_TENANT_KEY, targets)) return true;
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const ctx = currentContext();
    const active = (req.authSession.session as { activeOrganizationId?: string | null }).activeOrganizationId;
    const memberships = await this.prisma.system.member.findMany({
      where: { userId: ctx.userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    // The active school, else the first school they can use, else (to explain why) one where their access is off.
    const member = (active && memberships.find((m) => m.organizationId === active)) || memberships.find((m) => m.status !== "disabled") || memberships[0];
    if (!member) throw fail(403, ctx.platformRole === "admin" ? "Open a school from the console first" : "You aren't a member of any school");
    if (member.status === "disabled") throw fail(403, "Your access to this school is turned off");
    if (member.organization.status === "suspended") throw fail(403, `${member.organization.name} is suspended. Contact DeepDev support.`);
    // An invited person becomes active the first time they use the school.
    if (member.status === "invited") await this.prisma.system.member.update({ where: { id: member.id }, data: { status: "active" } });
    Object.assign(ctx, {
      tenantId: member.organizationId,
      memberId: member.id,
      role: member.role,
      branchIds: member.branchIds,
      modules: member.organization.modules,
      staffId: member.staffId ?? undefined,
    });
    return true;
  }
}
