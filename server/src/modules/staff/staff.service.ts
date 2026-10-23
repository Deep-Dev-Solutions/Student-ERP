import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { actorName, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { initialsOf, parseDay, toAllocation, toStaffMember } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { SaveStaffDto } from "./dto/save-staff.dto";
import type { SetAllocationDto } from "./dto/set-allocation.dto";

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getStaff */
  async list() {
    return (await this.prisma.tenant.staffMember.findMany({ orderBy: { name: "asc" } })).map(toStaffMember);
  }

  /** getTeachers: teaching staff who haven't left, as offered in pickers. */
  async listTeachers() {
    const rows = await this.prisma.tenant.staffMember.findMany({ where: { teaches: true, status: { not: "terminated" } }, orderBy: { name: "asc" } });
    return rows.map((m) => ({ id: m.staffId, name: m.name, avatar: m.avatar }));
  }

  /** saveStaff: adds a staff member (no id yet) or updates one. */
  async saveStaff(body: SaveStaffDto) {
    const name = body.name.trim();
    if (name.length < 3) throw fail(400, "Enter the full name");
    const tenantId = requireTenantId();
    if (await this.prisma.tenant.staffMember.findFirst({ where: { id: { not: body.id }, email: { equals: body.email, mode: "insensitive" } } }))
      throw fail(409, `${body.email} belongs to another staff member`);
    if (body.cnic && (await this.prisma.tenant.staffMember.findFirst({ where: { id: { not: body.id }, cnic: body.cnic } })))
      throw fail(409, "Another staff member has this CNIC");

    const data = {
      name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      department: body.department,
      joinDate: parseDay(body.joinDate),
      status: body.status,
      branchId: body.branchId,
      gender: body.gender,
      cnic: body.cnic,
      address: body.address,
      qualification: body.qualification,
      employment: body.employment,
      teaches: body.teaches,
      basicSalary: body.basicSalary,
      allowances: body.allowances as unknown as Prisma.InputJsonValue,
      bankAccount: body.bankAccount,
      avatar: initialsOf(name),
    };

    const saved = await this.prisma.tx(async (tx) => {
      if (body.id) {
        const existing = await tx.staffMember.findFirst({ where: { id: body.id } });
        if (existing) return tx.staffMember.update({ where: { id: body.id }, data });
      }
      const counter = await tx.counter.upsert({ where: { tenantId_key: { tenantId, key: "staff_no" } }, create: { tenantId, key: "staff_no", value: 1 }, update: { value: { increment: 1 } } });
      return tx.staffMember.create({ data: { id: body.id, tenantId, staffId: `STF-${counter.value}`, ...data } });
    });
    await this.audit.record("staff.saved", "staff_member", saved.id, { name });
    return toStaffMember(saved);
  }

  /** setStaffStatus: on leave, back to active, or left (which also frees their allocations and incharge role). */
  async setStaffStatus(id: string, status: "active" | "on_leave" | "terminated", date?: string, reason?: string) {
    const member = await this.prisma.tenant.staffMember.findFirst({ where: { id } });
    if (!member) throw fail(404, "Staff member not found");
    if (status === "terminated" && (!date || !reason?.trim())) throw fail(400, "Enter the leaving date and reason");

    await this.prisma.tx(async (tx) => {
      await tx.staffMember.update({
        where: { id },
        data: { status, left: status === "terminated" ? { date, reason: reason!.trim() } : Prisma.JsonNull },
      });
      if (status === "terminated") {
        await tx.teacherAllocation.deleteMany({ where: { teacherId: member.staffId } });
        await tx.section.updateMany({ where: { inchargeId: member.staffId }, data: { inchargeId: null } });
      }
    });
    await this.audit.record(`staff.${status}`, "staff_member", id);
    return null;
  }

  // Allocations --------------------------------------------------------------

  /** getAllocations */
  async listAllocations() {
    return (await this.prisma.tenant.teacherAllocation.findMany()).map(toAllocation);
  }

  /** setAllocation: sets who teaches a subject to a section (teacherId null clears it), and its periods. */
  async setAllocation(body: SetAllocationDto) {
    const tenantId = requireTenantId();
    const existing = await this.prisma.tenant.teacherAllocation.findFirst({ where: { sectionId: body.sectionId, subjectId: body.subjectId } });

    if (!body.teacherId) {
      if (existing) await this.prisma.tenant.teacherAllocation.delete({ where: { id: existing.id } });
      return null;
    }
    const teacher = await this.prisma.tenant.staffMember.findFirst({ where: { staffId: body.teacherId } });
    if (!teacher || !teacher.teaches || teacher.status === "terminated") throw fail(400, "Choose a current teacher");

    const data = { teacherId: body.teacherId, weeklyPeriods: body.weeklyPeriods ?? existing?.weeklyPeriods ?? 6 };
    const saved = existing
      ? await this.prisma.tenant.teacherAllocation.update({ where: { id: existing.id }, data })
      : await this.prisma.tenant.teacherAllocation.create({ data: { tenantId, classId: body.classId, sectionId: body.sectionId, subjectId: body.subjectId, ...data } });
    return toAllocation(saved);
  }
}
