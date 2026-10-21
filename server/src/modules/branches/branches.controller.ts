import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";
import { AuditService } from "../../common/audit.service";
import { requireTenantId } from "../../common/context";
import { RequirePermission } from "../../common/decorators";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";

class AddBranchDto {
  @IsString() @Length(2, 80) name!: string;
  @IsString() @Matches(/^[A-Za-z0-9-]{2,10}$/, { message: "The campus code should be 2 to 10 letters or numbers" }) code!: string;
  @IsString() @Length(2, 120) location!: string;
}

@ApiTags("branches")
@Controller("branches")
export class BranchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getBranches */
  @Get()
  async list() {
    const rows = await this.prisma.tenant.branch.findMany({ orderBy: { name: "asc" } });
    return rows.map(({ id, tenantId, name, code, location }) => ({ id, tenantId, name, code, location }));
  }

  /** addBranch: campus codes are unique within the school. */
  @RequirePermission("adm_system_settings")
  @Post()
  async add(@Body() body: AddBranchDto) {
    const code = body.code.toUpperCase();
    if (await this.prisma.tenant.branch.findFirst({ where: { code: { equals: code, mode: "insensitive" } } })) throw fail(409, `Branch code ${code} is already in use`);
    const created = await this.prisma.tenant.branch.create({ data: { tenantId: requireTenantId(), name: body.name.trim(), code, location: body.location.trim() } });
    await this.audit.record("branch.added", "branch", created.id, { name: created.name, code });
    return { id: created.id, tenantId: created.tenantId, name: created.name, code: created.code, location: created.location };
  }
}
