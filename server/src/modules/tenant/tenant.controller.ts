import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { requireTenantId } from "../../common/context";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toTenant } from "../../common/shapes";

/** getMyTenant: the caller's school, with its plan and modules. */
@ApiTags("tenant")
@Controller("tenant")
export class TenantController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const db = this.prisma.tenant;
    const org = await db.organization.findUniqueOrThrow({ where: { id: requireTenantId() } });
    const ownerMember = await db.member.findFirst({ where: { role: "owner" }, include: { user: true }, orderBy: { createdAt: "asc" } });
    const history = await db.tenantEvent.findMany({ orderBy: { at: "asc" } });
    return toTenant(org, ownerMember?.user ?? null, history);
  }
}
