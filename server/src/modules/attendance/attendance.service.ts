import { Injectable } from "@nestjs/common";
import { canMarkRegister, registerChanges, registerId, type AttendanceMode, type SchoolRole } from "../../domain/attendance";
import { AuditService } from "../../common/audit.service";
import { actorName, currentContext, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { hasPermission, type PermissionMatrix } from "../../common/permissions";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, toRegister, toStaffAttendanceDay, toUnlockRequest } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { SubmitRegisterDto } from "./dto/submit-register.dto";
import type { DecideUnlockDto, RequestUnlockDto, UnlockRegisterDto } from "./dto/unlock.dto";
import type { SaveStaffAttendanceDto } from "./dto/staff-attendance.dto";

const MARK_STATUSES = new Set(["present", "absent", "leave"]);
const STAFF_STATUSES = new Set(["present", "absent", "leave", "late"]);

function checkMarksShape(marks: Record<string, { status: string; remark?: string }>) {
  for (const mark of Object.values(marks)) if (!MARK_STATUSES.has(mark.status)) throw fail(400, "Choose present, absent or leave for every student");
}

/** Only restricts when the member is scoped to specific campuses; an empty list means every campus. */
function ensureBranchAccess(branchId: string) {
  const branchIds = currentContext().branchIds;
  if (branchIds?.length && !branchIds.includes(branchId)) throw fail(403, "That campus isn't assigned to you");
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Registers --------------------------------------------------------------

  /** getRegisters */
  async listRegisters() {
    const rows = await this.prisma.tenant.attendanceRegister.findMany({ orderBy: { date: "desc" } });
    return rows.map(toRegister);
  }

  /** submitRegister: saves a register. Resubmitting a reopened register records each change and locks it again. */
  async submitRegister(body: SubmitRegisterDto) {
    checkMarksShape(body.marks);
    ensureBranchAccess(body.branchId);

    const ctx = currentContext();
    const section = await this.prisma.tenant.section.findFirst({ where: { id: body.sectionId } });
    const rules = await this.prisma.tenant.schoolRules.findFirst();
    const mode = ((rules?.attendance as { mode?: AttendanceMode } | undefined)?.mode ?? "class_incharge") as AttendanceMode;
    const permRow = await this.prisma.tenant.tenantPermissions.findFirst();
    const hasAttMarkDailyPermission = hasPermission(ctx.role ?? "", "att_mark_daily", (permRow?.matrix ?? {}) as PermissionMatrix);
    const { canMark, reason } = canMarkRegister({
      role: (ctx.role ?? "teacher") as SchoolRole,
      staffId: ctx.staffId,
      mode,
      section,
      subjectId: body.subjectId,
      hasSubjectAllocation: false, // TeacherAllocation isn't built until Phase 4.
      hasAttMarkDailyPermission,
    });
    if (!canMark) throw fail(403, reason);

    const tenantId = requireTenantId();
    const id = registerId(body.sectionId, body.date, body.subjectId);
    const existing = await this.prisma.tenant.attendanceRegister.findFirst({ where: { id } });
    if (existing?.lockedAt && !existing.reopened) throw fail(409, "This register is locked. Ask a branch admin to reopen it.");

    const now = new Date();
    const actor = actorName();
    if (!existing) {
      const created = await this.prisma.tenant.attendanceRegister.create({
        data: {
          id,
          tenantId,
          branchId: body.branchId,
          classId: body.classId,
          sectionId: body.sectionId,
          date: parseDay(body.date),
          subjectId: body.subjectId,
          marks: body.marks,
          submittedAt: now,
          submittedBy: actor,
          changes: [],
        },
      });
      await this.audit.record("register.submitted", "attendance_register", id);
      return toRegister(created);
    }

    const reopenedInfo = existing.reopened as { reason?: string } | null;
    type Marks = Record<string, { status: "present" | "absent" | "leave"; remark?: string }>;
    const changes = registerChanges(existing.marks as Marks, body.marks as Marks, actor, reopenedInfo?.reason ?? "");
    const updated = await this.prisma.tenant.attendanceRegister.update({
      where: { id },
      data: {
        marks: body.marks,
        submittedAt: now,
        submittedBy: actor,
        changes: [...(existing.changes as unknown[]), ...changes] as unknown as Prisma.InputJsonValue,
        ...(existing.reopened ? { lockedAt: now, lockedBy: actor, reopened: Prisma.JsonNull } : {}),
      },
    });
    await this.audit.record("register.submitted", "attendance_register", id, { changed: changes.length });
    return toRegister(updated);
  }

  /** lockRegisters */
  async lockRegisters(ids: string[]) {
    const now = new Date();
    const actor = actorName();
    await this.prisma.tx(async (tx) => {
      await tx.attendanceRegister.updateMany({ where: { id: { in: ids }, lockedAt: null }, data: { lockedAt: now, lockedBy: actor, reopened: Prisma.JsonNull } });
    });
    await this.audit.record("register.locked", "attendance_register", undefined, { count: ids.length });
    return null;
  }

  /** unlockRegister: reopens a locked register so it can be corrected. A reason is required. */
  async unlockRegister(id: string, body: UnlockRegisterDto) {
    if (body.reason.trim().length < 10) throw fail(400, "Explain why the register needs changing (at least a short sentence).");
    const register = await this.prisma.tenant.attendanceRegister.findFirst({ where: { id } });
    if (!register) throw fail(404, "Register not found");
    ensureBranchAccess(register.branchId);
    const now = new Date();
    const actor = actorName();
    await this.prisma.tx(async (tx) => {
      await tx.attendanceRegister.update({ where: { id }, data: { lockedAt: null, lockedBy: null, reopened: { at: now.toISOString(), by: actor, reason: body.reason.trim() } } });
      await tx.unlockRequest.updateMany({ where: { registerId: id, status: "pending" }, data: { status: "approved", decidedBy: actor, decidedAt: now } });
    });
    await this.audit.record("register.unlocked", "attendance_register", id);
    return null;
  }

  // Unlock requests ----------------------------------------------------------

  /** getUnlockRequests */
  async listUnlockRequests() {
    const rows = await this.prisma.tenant.unlockRequest.findMany({ orderBy: { requestedAt: "desc" } });
    return rows.map(toUnlockRequest);
  }

  /** requestUnlock */
  async requestUnlock(body: RequestUnlockDto) {
    if (body.reason.trim().length < 10) throw fail(400, "Explain what needs changing (at least a short sentence).");
    if (await this.prisma.tenant.unlockRequest.findFirst({ where: { registerId: body.registerId, status: "pending" } }))
      throw fail(409, "A request to reopen this register is already waiting.");
    const created = await this.prisma.tenant.unlockRequest.create({
      data: { tenantId: requireTenantId(), registerId: body.registerId, reason: body.reason.trim(), requestedBy: actorName(), requestedAt: new Date(), status: "pending" },
    });
    return toUnlockRequest(created);
  }

  /** decideUnlock: approve or decline a pending unlock request. */
  async decideUnlock(id: string, body: DecideUnlockDto) {
    const request = await this.prisma.tenant.unlockRequest.findFirst({ where: { id } });
    if (!request || request.status !== "pending") throw fail(404, "This request was already handled");
    const now = new Date();
    const actor = actorName();
    await this.prisma.tx(async (tx) => {
      await tx.unlockRequest.update({ where: { id }, data: { status: body.approve ? "approved" : "declined", decidedBy: actor, decidedAt: now } });
      if (body.approve) {
        await tx.attendanceRegister.update({
          where: { id: request.registerId },
          data: { lockedAt: null, lockedBy: null, reopened: { at: now.toISOString(), by: actor, reason: `${request.reason} (requested by ${request.requestedBy})` } },
        });
      }
    });
    return null;
  }

  /** markAlertsSent: records that absence alerts went out. The guardian message log itself is Phase 7 (Messages). */
  async markAlertsSent(ids: string[]) {
    await this.prisma.tenant.attendanceRegister.updateMany({ where: { id: { in: ids } }, data: { alertsSentAt: new Date() } });
    return null;
  }

  // Staff attendance -----------------------------------------------------------

  /** getStaffAttendance */
  async listStaffAttendance() {
    const rows = await this.prisma.tenant.staffAttendanceDay.findMany({ orderBy: { date: "desc" } });
    return rows.map(toStaffAttendanceDay);
  }

  /** saveStaffAttendance */
  async saveStaffAttendance(date: string, body: SaveStaffAttendanceDto) {
    ensureBranchAccess(body.branchId);
    for (const status of Object.values(body.marks)) if (!STAFF_STATUSES.has(status)) throw fail(400, "Choose present, absent, leave or late for every staff member");
    const id = `${body.branchId}:${date}`;
    const saved = await this.prisma.tenant.staffAttendanceDay.upsert({
      where: { id },
      create: { id, tenantId: requireTenantId(), branchId: body.branchId, date: parseDay(date), marks: body.marks, savedAt: new Date(), savedBy: actorName() },
      update: { marks: body.marks, savedAt: new Date(), savedBy: actorName() },
    });
    return toStaffAttendanceDay(saved);
  }
}
