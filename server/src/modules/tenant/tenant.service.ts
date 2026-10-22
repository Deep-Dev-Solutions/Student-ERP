import { Injectable } from "@nestjs/common";
import { requireTenantId } from "../../common/context";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toTenant } from "../../common/shapes";

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /** getMyTenant: the caller's school, with its plan and modules. */
  async get() {
    const db = this.prisma.tenant;
    const org = await db.organization.findUniqueOrThrow({ where: { id: requireTenantId() } });
    const ownerMember = await db.member.findFirst({ where: { role: "owner" }, include: { user: true }, orderBy: { createdAt: "asc" } });
    const history = await db.tenantEvent.findMany({ orderBy: { at: "asc" } });
    return toTenant(org, ownerMember?.user ?? null, history);
  }
}
