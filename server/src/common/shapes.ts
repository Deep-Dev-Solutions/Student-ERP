/* Response shapes matching client/src/types, so the frontend can switch from mocks without changes. */
import type { AcademicSession, Advance, AttendanceRegister, BankQuestion, DayClosing, Exam, ExamMark, ExamPaper, FeeReminder, FeeVoucher, Guardian, Member, Organization, Paper, PaperBoard, PaperBook, PaperChapter, PaperClass, PaperSubTopic, Payment, PayrollRun, Payslip, StaffAttendanceDay, StaffMember, Student, StudentActivity, StudentDocument, TeacherAllocation, TenantEvent, UnlockRequest, User } from "../generated/prisma/client";

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

/** client/src/types/staff.ts → StaffMember */
export const toStaffMember = (m: StaffMember) => ({
  id: m.id,
  staffId: m.staffId,
  name: m.name,
  avatar: m.avatar,
  email: m.email,
  phone: m.phone,
  role: m.role,
  department: m.department,
  joinDate: day(m.joinDate),
  status: m.status,
  branchId: m.branchId,
  gender: m.gender,
  cnic: m.cnic ?? undefined,
  address: m.address ?? undefined,
  qualification: m.qualification ?? undefined,
  employment: m.employment,
  teaches: m.teaches,
  basicSalary: m.basicSalary,
  allowances: m.allowances as { label: string; amount: number }[],
  bankAccount: m.bankAccount ?? undefined,
  left: (m.left as { date: string; reason: string } | null) ?? undefined,
});

/** client/src/types/staff.ts → TeacherAllocation */
export const toAllocation = (a: TeacherAllocation) => ({ id: a.id, teacherId: a.teacherId, subjectId: a.subjectId, classId: a.classId, sectionId: a.sectionId, weeklyPeriods: a.weeklyPeriods });

/** client/src/types/staff.ts → Advance */
export const toAdvance = (a: Advance) => ({ id: a.id, staffId: a.staffId, amount: a.amount, date: day(a.date), reason: a.reason, monthlyRecovery: a.monthlyRecovery, recovered: a.recovered });

/** client/src/types/staff.ts → PayrollRun */
export const toPayrollRun = (r: PayrollRun) => ({
  id: r.id,
  branchId: r.branchId,
  month: r.month,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
  createdBy: r.createdBy,
  finalisedAt: r.finalisedAt?.toISOString() ?? undefined,
});

/** client/src/types/staff.ts → Payslip */
export const toPayslip = (p: Payslip) => ({
  id: p.id,
  runId: p.runId,
  staffId: p.staffId,
  month: p.month,
  basic: p.basic,
  allowances: p.allowances as { label: string; amount: number }[],
  adjustments: p.adjustments as { label: string; amount: number }[],
  absentDays: p.absentDays,
  absentDeduction: p.absentDeduction,
  advanceRecovery: p.advanceRecovery,
  tax: p.tax,
  eobi: p.eobi,
  gross: p.gross,
  totalDeductions: p.totalDeductions,
  net: p.net,
  periodsPerWeek: p.periodsPerWeek,
  status: p.status,
  paidAt: p.paidAt?.toISOString() ?? undefined,
  method: p.method ?? undefined,
});

/** client/src/types/exams.ts → Exam */
export const toExam = (e: Exam) => ({
  id: e.id,
  branchId: e.branchId,
  sessionId: e.sessionId,
  title: e.title,
  termType: e.termType,
  startDate: day(e.startDate),
  endDate: day(e.endDate),
  classIds: e.classIds,
  publishedAt: e.publishedAt?.toISOString() ?? undefined,
  createdBy: e.createdBy,
});

/** client/src/types/exams.ts → ExamPaper */
export const toExamPaper = (p: ExamPaper) => ({ id: p.id, examId: p.examId, classId: p.classId, subjectId: p.subjectId, date: day(p.date), totalMarks: p.totalMarks, passMarks: p.passMarks });

/** client/src/types/exams.ts → ExamMark */
export const toExamMark = (m: ExamMark) => ({
  id: m.id,
  examId: m.examId,
  subjectId: m.subjectId,
  studentId: m.studentId,
  obtained: m.obtained,
  absent: m.absent,
  remark: m.remark ?? undefined,
  updatedAt: m.updatedAt.toISOString(),
  updatedBy: m.updatedBy,
});

/** client/src/types/paper.ts → PaperCatalog, assembled from the global catalogue tables. */
export const toPaperCatalog = (rows: { boards: PaperBoard[]; classes: PaperClass[]; books: PaperBook[]; chapters: PaperChapter[]; subTopics: PaperSubTopic[] }) => ({
  boards: rows.boards.map((b) => ({ id: b.id, name: b.name, shortName: b.shortName })),
  classes: rows.classes.map((c) => ({ id: c.id, boardId: c.boardId, name: c.name })),
  books: rows.books.map((b) => ({ id: b.id, boardId: b.boardId, classId: b.classId, title: b.title, subject: b.subject })),
  chapters: rows.chapters.map((c) => ({ id: c.id, bookId: c.bookId, number: c.number, title: c.title })),
  subTopics: rows.subTopics.map((s) => ({ id: s.id, chapterId: s.chapterId, title: s.title })),
});

/** client/src/types/paper.ts → BankQuestion */
export const toBankQuestion = (q: BankQuestion) => ({
  id: q.id,
  subTopicId: q.subTopicId,
  type: q.type as "mcq" | "short" | "long",
  text: q.text,
  options: q.options.length ? q.options : undefined,
  answer: q.answer,
});

/** client/src/types/paper.ts → Paper */
export const toPaper = (p: Paper) => ({
  id: p.id,
  branchId: p.branchId,
  teacherId: p.teacherId,
  teacherName: p.teacherName,
  status: p.status as "draft" | "submitted" | "printed" | "returned",
  step: p.step,
  boardId: p.boardId,
  classId: p.classId,
  bookId: p.bookId,
  subTopicIds: p.subTopicIds,
  blueprint: p.blueprint as { type: string; count: number; marks: number }[],
  questions: p.questions as unknown[],
  details: p.details as { examName: string; date: string; timeAllowed: string; instructions: string },
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
  submittedAt: p.submittedAt?.toISOString() ?? undefined,
  printedAt: p.printedAt?.toISOString() ?? undefined,
  returnNote: p.returnNote ?? undefined,
  history: p.history as unknown[],
});
