import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { currentContext } from "../../common/context";
import { NoTenant } from "../../common/decorators";
import { fail } from "../../common/errors";
import type { AuthedRequest } from "../../common/guards/auth.guard";
import { PrismaService } from "../../common/prisma/prisma.service";
import { initialsOf, toAppUser } from "../../common/shapes";

class ActiveTenantDto {
  @IsString() tenantId!: string;
}

@ApiTags("me")
@Controller("me")
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /** Who is signed in, the schools they belong to, and the active one. */
  @NoTenant()
  @Get()
  async me(@Req() req: AuthedRequest) {
    const ctx = currentContext();
    const user = await this.prisma.system.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    const memberships = await this.prisma.system.member.findMany({ where: { userId: user.id }, include: { organization: true }, orderBy: { createdAt: "asc" } });
    const activeId = (req.authSession.session as { activeOrganizationId?: string | null }).activeOrganizationId;
    const active = memberships.find((m) => m.organizationId === activeId) ?? memberships.find((m) => m.status !== "disabled");
    const platformAdmin = ctx.platformRole === "admin";
    return {
      user: active
        ? toAppUser(active, user)
        : platformAdmin
          ? { id: user.id, name: user.name, email: user.email, role: "super_admin", title: "Platform admin", initials: initialsOf(user.name), branchIds: [], status: "active" }
          : null,
      platformAdmin,
      impersonatedBy: ctx.impersonatedBy ?? null,
      activeTenantId: active?.organizationId ?? null,
      activeTenant: active ? { id: active.organization.id, name: active.organization.name, status: active.organization.status } : null,
      memberships: memberships.map((m) => ({ tenantId: m.organizationId, name: m.organization.name, role: m.role, status: m.status })),
    };
  }

  /** Switches the active school for this session. */
  @NoTenant()
  @Post("active-tenant")
  async setActive(@Req() req: AuthedRequest, @Body() body: ActiveTenantDto) {
    const member = await this.prisma.system.member.findFirst({ where: { userId: currentContext().userId, organizationId: body.tenantId } });
    if (!member || member.status === "disabled") throw fail(403, "You can't open that school");
    await this.authService.auth.api.setActiveOrganization({ headers: fromNodeHeaders(req.headers), body: { organizationId: body.tenantId } });
    return { activeTenantId: body.tenantId };
  }
}
