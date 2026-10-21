import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, ValidateIf } from "class-validator";
import { z } from "zod";
import { AuditService } from "../../common/audit.service";
import { currentContext, requireTenantId } from "../../common/context";
import { RequirePermission } from "../../common/decorators";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";

class CampusProfileDto {
  @IsString() @Length(2, 120) schoolName!: string;
  @IsString() tagline!: string;
  @IsString() registrationNumber!: string;
  @ValidateIf((o: CampusProfileDto) => o.contactEmail !== "") @IsEmail({}, { message: "Enter a valid contact email" }) contactEmail!: string;
  @IsString() contactPhone!: string;
  @IsString() website!: string;
  @IsString() streetAddress!: string;
  @IsString() city!: string;
  @IsString() province!: string;
  @IsString() postalCode!: string;
  @IsString() country!: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsString() principalName!: string;
}

const ROLES = ["owner", "branch_admin", "accountant", "front_desk", "teacher"] as const;
const matrixSchema = z.record(z.string(), z.object(Object.fromEntries(ROLES.map((r) => [r, z.boolean()]))).partial());

/** client/src/types/settings.ts → SchoolRules */
const rulesSchema = z.object({
  attendance: z.object({
    mode: z.enum(["class_incharge", "subject_wise", "single_marker", "admin_oversight"]),
    lockAfterHours: z.number().int().min(0).max(720),
    holidays: z.array(z.object({ id: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), name: z.string().min(1) })),
  }),
  fees: z.object({
    dueDay: z.number().int().min(1).max(28),
    lateFinePerDay: z.number().int().min(0),
    graceDays: z.number().int().min(0).max(60),
    siblingDiscountPercent: z.number().min(0).max(100),
  }),
  grading: z.object({
    passPercent: z.number().min(0).max(100),
    bands: z.array(z.object({ label: z.string().min(1).max(3), min: z.number().min(0).max(100) })).min(1),
  }),
  notifications: z.record(z.string(), z.boolean()),
});

const omitTenant = <T extends { tenantId: string }>({ tenantId: _t, ...rest }: T) => rest;

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getCampusProfile */
  @Get("campus-profile")
  async profile() {
    const row = await this.prisma.tenant.campusProfile.findFirst();
    if (row) return omitTenant(row);
    const org = await this.prisma.tenant.organization.findUniqueOrThrow({ where: { id: requireTenantId() } });
    return { schoolName: org.name, tagline: "", registrationNumber: "", contactEmail: "", contactPhone: "", website: "", streetAddress: "", city: org.city, province: "", postalCode: "", country: "Pakistan", principalName: "" };
  }

  /** updateCampusProfile */
  @RequirePermission("adm_system_settings")
  @Put("campus-profile")
  async updateProfile(@Body() body: CampusProfileDto) {
    const tenantId = requireTenantId();
    const data = { ...body, schoolName: body.schoolName.trim() };
    const row = await this.prisma.tenant.campusProfile.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    await this.audit.record("settings.campus_profile", "campus_profile", tenantId);
    return omitTenant(row);
  }

  /** getRolePermissions */
  @Get("permissions")
  async permissions() {
    return (await this.prisma.tenant.tenantPermissions.findFirst())?.matrix ?? {};
  }

  /** updateRolePermissions: only the owner, so no one can grant themselves more access. */
  @RequirePermission("adm_system_settings")
  @Put("permissions")
  async updatePermissions(@Body() body: unknown) {
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
  @Get("rules")
  async rules() {
    const row = await this.prisma.tenant.schoolRules.findFirst();
    if (!row) throw fail(404, "School rules aren't set up yet");
    return omitTenant(row);
  }

  /** updateSchoolRules */
  @RequirePermission("adm_system_settings")
  @Put("rules")
  async updateRules(@Body() body: unknown) {
    const parsed = rulesSchema.safeParse(body);
    if (!parsed.success) throw fail(400, `School rules: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message ?? "is invalid"}`);
    const tenantId = requireTenantId();
    const data = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v as Prisma.InputJsonValue])) as Record<keyof typeof parsed.data, Prisma.InputJsonValue>;
    const row = await this.prisma.tenant.schoolRules.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    await this.audit.record("settings.rules", "school_rules", tenantId);
    return omitTenant(row);
  }
}
