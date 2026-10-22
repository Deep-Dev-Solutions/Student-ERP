import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AddBranchDto } from "./dto/add-branch.dto";

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getBranches */
  async list() {
    const rows = await this.prisma.tenant.branch.findMany({ orderBy: { name: "asc" } });
    return rows.map(({ id, tenantId, name, code, location }) => ({ id, tenantId, name, code, location }));
  }

  /** addBranch: campus codes are unique within the school. */
  async add(body: AddBranchDto) {
    const code = body.code.toUpperCase();
    if (await this.prisma.tenant.branch.findFirst({ where: { code: { equals: code, mode: "insensitive" } } })) throw fail(409, `Branch code ${code} is already in use`);
    const created = await this.prisma.tenant.branch.create({ data: { tenantId: requireTenantId(), name: body.name.trim(), code, location: body.location.trim() } });
    await this.audit.record("branch.added", "branch", created.id, { name: created.name, code });
    return { id: created.id, tenantId: created.tenantId, name: created.name, code: created.code, location: created.location };
  }
}
