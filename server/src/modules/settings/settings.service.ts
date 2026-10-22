import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { currentContext, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import type { CampusProfileDto } from "./dto/campus-profile.dto";
import { matrixSchema } from "./dto/permissions.schema";
import { rulesSchema } from "./dto/rules.schema";

const omitTenant = <T extends { tenantId: string }>({ tenantId: _t, ...rest }: T) => rest;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getCampusProfile */
  async profile() {
    const row = await this.prisma.tenant.campusProfile.findFirst();
    if (row) return omitTenant(row);
    const org = await this.prisma.tenant.organization.findUniqueOrThrow({ where: { id: requireTenantId() } });
    return { schoolName: org.name, tagline: "", registrationNumber: "", contactEmail: "", contactPhone: "", website: "", streetAddress: "", city: org.city, province: "", postalCode: "", country: "Pakistan", principalName: "" };
  }

  /** updateCampusProfile */
  async updateProfile(body: CampusProfileDto) {
    const tenantId = requireTenantId();
    const data = { ...body, schoolName: body.schoolName.trim() };
    const row = await this.prisma.tenant.campusProfile.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    await this.audit.record("settings.campus_profile", "campus_profile", tenantId);
    return omitTenant(row);
  }

  /** getRolePermissions */
  async permissions() {
    return (await this.prisma.tenant.tenantPermissions.findFirst())?.matrix ?? {};
  }

  /** updateRolePermissions: only the owner, so no one can grant themselves more access. */
  async updatePermissions(body: unknown) {
    if (currentContext().role !== "owner") throw fail(403, "Only the owner can change what each role may do");
    const parsed = matrixSchema.safeParse(body);
    if (!parsed.success) throw fail(400, "The permissions don't look right");
    const tenantId = requireTenantId();
    const matrix = parsed.data as Prisma.InputJsonValue;
    await this.prisma.tenant.tenantPermissions.upsert({ where: { tenantId }, create: { tenantId, matrix }, update: { matrix } });
    await this.audit.record("settings.permissions", "tenant_permissions", tenantId);
    return parsed.data;
  }

  /** getSchoolRules */
  async rules() {
    const row = await this.prisma.tenant.schoolRules.findFirst();
    if (!row) throw fail(404, "School rules aren't set up yet");
    return omitTenant(row);
  }

  /** updateSchoolRules */
  async updateRules(body: unknown) {
    const parsed = rulesSchema.safeParse(body);
    if (!parsed.success) throw fail(400, `School rules: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message ?? "is invalid"}`);
    const tenantId = requireTenantId();
    const data = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v as Prisma.InputJsonValue])) as Record<keyof typeof parsed.data, Prisma.InputJsonValue>;
    const row = await this.prisma.tenant.schoolRules.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    await this.audit.record("settings.rules", "school_rules", tenantId);
    return omitTenant(row);
  }
}
