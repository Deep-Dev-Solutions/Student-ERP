/* Response shapes matching client/src/types, so the frontend can switch from mocks without changes. */
import type { AcademicSession, AttendanceRegister, DayClosing, FeeReminder, FeeVoucher, Guardian, Member, Organization, Payment, StaffAttendanceDay, Student, StudentActivity, StudentDocument, TenantEvent, UnlockRequest, User } from "../generated/prisma/client";

const day = (d: Date) => d.toISOString().slice(0, 10);
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** client/src/types/user.ts → User */
export function toAppUser(member: Member, user: Pick<User, "id" | "name" | "email" | "image">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: member.role,
    title: member.title,
    initials: initialsOf(user.name),
    avatarUrl: user.image ?? undefined,
    branchIds: member.branchIds,
    status: member.status,
    staffId: member.staffId ?? undefined,
  };
}

/** client/src/types/org.ts → AcademicSession */
export const toSession = (s: AcademicSession) => ({ id: s.id, label: s.label, startDate: day(s.startDate), endDate: day(s.endDate), current: s.current });

/** client/src/types/tenant.ts → Tenant */
export function toTenant(org: Organization, owner: Pick<User, "name" | "email" | "phone"> | null, history: TenantEvent[]) {
  return {
    id: org.id,
    name: org.name,
    city: org.city,
    status: org.status,
    modules: org.modules,
    studentSeats: org.studentSeats,
    owner: { name: owner?.name ?? "", email: owner?.email ?? "", phone: owner?.phone ?? "" },
    createdAt: org.createdAt.toISOString(),
    history: history.map((e) => ({ at: e.at.toISOString(), by: e.by, text: e.text })),
  };
}

/** Parses "YYYY-MM-DD" as a calendar date (stored in a date column, no time zone). */
export const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`);

/** Today's calendar date in Asia/Karachi, "YYYY-MM-DD" (client/src/lib/dates.ts's localISODate, server-side). */
export const todayInSchool = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

/** client/src/types/student.ts → Guardian */
export const toGuardian = (g: Guardian) => ({
  id: g.id,
  name: g.name,
  relation: g.relation,
  cnic: g.cnic ?? undefined,
  phone: g.phone,
  whatsapp: g.whatsapp,
  primary: g.primary,
  occupation: g.occupation ?? undefined,
});

/** client/src/types/student.ts → StudentDocument */
export const toStudentDocument = (d: StudentDocument) => ({ id: d.id, name: d.name, kind: d.kind, fileName: d.fileName, sizeKb: d.sizeKb, uploadedAt: day(d.uploadedAt) });

/** client/src/types/student.ts → StudentActivity */
export const toStudentActivity = (a: StudentActivity) => ({ id: a.id, studentId: a.studentId, at: a.at.toISOString(), actor: a.actor, text: a.text });

/** client/src/types/student.ts → Student */
export function toStudent(s: Student, guardians: Guardian[], documents: StudentDocument[]) {
  return {
    id: s.id,
    admissionNo: s.admissionNo,
    admissionDate: day(s.admissionDate),
    name: s.name,
    email: s.email,
    avatar: s.avatar,
    photoUrl: s.photoUrl ?? undefined,
    bForm: s.bForm ?? undefined,
    dateOfBirth: day(s.dateOfBirth),
    gender: s.gender,
    bloodGroup: s.bloodGroup ?? undefined,
    religion: s.religion ?? undefined,
    address: s.address,
    previousSchool: s.previousSchool ?? undefined,
    branchId: s.branchId,
    classId: s.classId,
    sectionId: s.sectionId,
    electiveSubjectIds: s.electiveSubjectIds,
    guardians: guardians.map(toGuardian),
    siblingIds: s.siblingIds,
    monthlyFee: s.monthlyFee,
    discountPercent: s.discountPercent,
    enrollment: s.enrollment,
    withdrawal: (s.withdrawal as { date: string; reason: string; note?: string } | null) ?? undefined,
    feeStatus: s.feeStatus,
    attendance: s.attendance,
    balance: s.balance,
    documents: documents.map(toStudentDocument),
  };
}

/** client/src/types/attendance.ts → AttendanceRegister */
export const toRegister = (r: AttendanceRegister) => ({
  id: r.id,
  branchId: r.branchId,
  classId: r.classId,
  sectionId: r.sectionId,
  date: day(r.date),
  subjectId: r.subjectId ?? undefined,
  marks: r.marks as Record<string, { status: string; remark?: string }>,
  submittedAt: r.submittedAt.toISOString(),
  submittedBy: r.submittedBy,
  lockedAt: r.lockedAt?.toISOString() ?? undefined,
  lockedBy: r.lockedBy ?? undefined,
  reopened: (r.reopened as { at: string; by: string; reason: string } | null) ?? undefined,
  alertsSentAt: r.alertsSentAt?.toISOString() ?? undefined,
  changes: r.changes as unknown[],
});

/** client/src/types/attendance.ts → UnlockRequest */
export const toUnlockRequest = (u: UnlockRequest) => ({
  id: u.id,
  registerId: u.registerId,
  reason: u.reason,
  requestedBy: u.requestedBy,
  requestedAt: u.requestedAt.toISOString(),
  status: u.status,
  decidedBy: u.decidedBy ?? undefined,
  decidedAt: u.decidedAt?.toISOString() ?? undefined,
});

/** client/src/types/attendance.ts → StaffAttendanceDay */
export const toStaffAttendanceDay = (d: StaffAttendanceDay) => ({
  id: d.id,
  branchId: d.branchId,
  date: day(d.date),
  marks: d.marks as Record<string, string>,
  savedAt: d.savedAt.toISOString(),
  savedBy: d.savedBy,
});

/** client/src/types/fees.ts → FeeVoucher */
export const toVoucher = (v: FeeVoucher) => ({
  id: v.id,
  voucherNumber: v.voucherNumber,
  studentId: v.studentId,
  branchId: v.branchId,
  classId: v.classId,
  sectionId: v.sectionId,
  month: v.month,
  issueDate: day(v.issueDate),
  dueDate: day(v.dueDate),
  lines: v.lines as { headId: string; label: string; amount: number }[],
  discount: v.discount,
  totalAmount: v.totalAmount,
  paidAmount: v.paidAmount,
  status: v.status,
  cancelled: (v.cancelled as { at: string; by: string; reason: string } | null) ?? undefined,
});

/** client/src/types/fees.ts → Payment */
export const toPayment = (p: Payment) => ({
  id: p.id,
  receiptNo: p.receiptNo,
  voucherId: p.voucherId,
  studentId: p.studentId,
  branchId: p.branchId,
  amount: p.amount,
  lateFine: p.lateFine,
  method: p.method,
  at: p.at.toISOString(),
  by: p.by,
  reversed: (p.reversed as { at: string; by: string; reason: string } | null) ?? undefined,
});

/** client/src/types/fees.ts → DayClosing */
export const toDayClosing = (d: DayClosing) => ({
  id: d.id,
  branchId: d.branchId,
  date: day(d.date),
  totals: d.totals as Record<string, number>,
  cashCounted: d.cashCounted,
  note: d.note ?? undefined,
  closedAt: d.closedAt.toISOString(),
  closedBy: d.closedBy,
});

/** client/src/types/fees.ts → FeeReminder */
export const toFeeReminder = (r: FeeReminder) => ({ id: r.id, studentId: r.studentId, at: r.at.toISOString(), by: r.by });
