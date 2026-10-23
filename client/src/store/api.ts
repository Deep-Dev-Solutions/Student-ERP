import { createApi, fakeBaseQuery, type BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { usesApi } from "@/lib/api-mode";
import { db, mockActor, mockActorRole, mockTenantId, type MockDb } from "@/mocks/db";
import { mockTenantService } from "@/services/tenant/mockTenantService";
import type { NewTenantInput, PlatformCaller } from "@/services/tenant/contract";
import { hasPermission } from "@/lib/auth/permissions";
import { PRINT_PERMISSION, type CallerContext, type CatalogItemInput, type CatalogKind } from "@/services/paper/contract";
import { mockPaperService } from "@/services/paper/mockPaperService";
import { buildVoucher, feeStanding, settleVoucher, voucherBalance } from "@/lib/fees";
import { deliveryChannel, messageCost, renderTemplate, smsSegments } from "@/lib/messaging";
import { computePayslip } from "@/lib/payroll";
import { periodsOf, teachersFrom } from "@/mocks/staff";
import type {
  ModuleKey,
  Tenant,
  TenantStatus,
  BankQuestion,
  Paper,
  PaperCatalog,
  PaperDraftInput,
  MessageBatch,
  MessageRecipient,
  MessageTemplate,
  Exam,
  ExamMark,
  ExamPaper,
  AcademicSession,
  Branch,
  CampusProfileData,
  ClassSubject,
  FeeVoucher,
  PaymentInput,
  Payment,
  FeeHead,
  FeePlan,
  Concession,
  DayClosing,
  StaffMember,
  TeacherAllocation,
  Payslip,
  PayrollRun,
  Advance,
  SalaryComponent,
  RolePermissionsState,
  SchoolClass,
  SchoolRules,
  Section,
  Student,
  StudentDocument,
  Subject,
  User,
  AdmissionInput,
  Guardian,
  Withdrawal,
  AttendanceRegister,
  RegisterChange,
  StaffAttendanceDay,
  UnlockRequest,
} from "@/types";
import { localISODate } from "@/lib/dates";

/*
 * One API slice for the whole app. Every endpoint reads and writes the
 * in-memory mock database for now; when the NestJS API exists, swap
 * `fakeBaseQuery` for `fetchBaseQuery({ baseUrl })` and each `queryFn` for a
 * `query`. Mutations return `{ error }` the way the real API will.
 */

type Tag =
  | "Voucher" | "Session" | "Branch" | "User" | "Class" | "Section"
  | "Subject" | "ClassSubject" | "Permissions" | "Rules" | "Campus" | "Student" | "StudentActivity" | "Register" | "UnlockRequest" | "StaffAttendance" | "Payment" | "FeeStructure" | "DayClosing" | "FeeReminder" | "Staff" | "Allocation" | "Payroll" | "Exam" | "Message" | "Paper" | "Tenant";

/** A read endpoint that returns one collection from the mock database. */
const read = <K extends keyof MockDb>(key: K, tag?: Tag) => ({
  queryFn: () => ({ data: db[key] }),
  ...(tag ? { providesTags: [tag] } : {}),
});

type ApiError = { status: number; message: string };
type ApiRequest = { url: string; method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

/**
 * Calls the NestJS API (same origin through the /api rewrite). The session cookie goes
 * with it, and x-branch-id tells the server which campus is selected.
 */
async function callApi<T>(req: ApiRequest, api: BaseQueryApi): Promise<{ data: T } | { error: ApiError }> {
  const state = api.getState() as { session?: { branchId?: string } };
  try {
    const res = await fetch(`/api${req.url}`, {
      method: req.method ?? "GET",
      credentials: "include",
      headers: { "content-type": "application/json", ...(state.session?.branchId ? { "x-branch-id": state.session.branchId } : {}) },
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) return { error: { status: res.status, message: typeof json?.message === "string" ? json.message : "Something went wrong. Try again." } };
    return { data: json as T };
  } catch {
    return { error: { status: 0, message: "Can't reach the server. Check your connection." } };
  }
}

/** An endpoint that runs on the real API once migrated (see lib/api-mode.ts), and on the mock until then. */
function apiOr<A, R>(endpoint: string, mock: (arg: A) => { data: R } | { error: ApiError }, toRequest: (arg: A) => ApiRequest) {
  return (arg: A, api: BaseQueryApi) => (usesApi(endpoint) ? callApi<R>(toRequest(arg), api) : mock(arg));
}

/** A read of the whole collection: GET url on the API, the mock collection otherwise. */
const readOr = <K extends keyof MockDb>(endpoint: string, key: K, tag: Tag, url: string) => ({
  queryFn: apiOr<void, MockDb[K]>(endpoint, () => ({ data: db[key] }), () => ({ url })),
  providesTags: [tag],
});

const fail = (status: number, message: string) => ({ error: { status, message } });

/** The caller as the paper service sees it. The real API takes this from the sign-in token. */
const paperCaller = (staffId?: string): CallerContext => ({
  name: mockActor(),
  staffId,
  canPrintPapers: hasPermission(mockActorRole(), PRINT_PERMISSION, db.rolePermissions),
  isPlatformAdmin: mockActorRole() === "super_admin",
});

/** The caller as the tenant service sees it. The real API takes this from the sign-in token. */
const platformCaller = (tenantId = mockTenantId()): PlatformCaller => ({
  name: mockActor(),
  isPlatformAdmin: mockActorRole() === "super_admin",
  tenantId,
});

/** Admissions need the Students module and a free seat on the school's plan. */
function seatProblem(adding: number): { error: { status: number; message: string } } | null {
  const tenant = db.tenants.find((t) => t.id === mockTenantId());
  if (!tenant) return null;
  if (!tenant.modules.includes("students")) return fail(403, "Students and admissions isn't part of your plan");
  const active = db.students.filter((st) => st.enrollment === "active").length;
  if (active + adding > tenant.studentSeats)
    return fail(409, `Your plan allows ${tenant.studentSeats.toLocaleString("en-PK")} students and ${active.toLocaleString("en-PK")} are enrolled. Ask DeepDev to add seats.`);
  return null;
}

/** Records an automatic message (fee reminder, absence alert) to students' primary guardians in the send log. */
function logGuardianMessage(branchId: string, studentIds: string[], templateId: string, audience: string, vars: (studentId: string) => Record<string, string>) {
  const template = db.messageTemplates.find((t) => t.id === templateId);
  if (!template || studentIds.length === 0) return;
  const channel = templateId === "tpl-absent" && db.schoolRules.notifications.absenceWhatsApp ? "whatsapp" : "sms";
  const recipients: MessageRecipient[] = [];
  for (const id of studentIds) {
    const student = db.students.find((s) => s.id === id);
    const guardian = student?.guardians.find((g) => g.primary) ?? student?.guardians[0];
    const via = guardian && deliveryChannel(channel, guardian.whatsapp, db.schoolRules.notifications.smsFallback);
    if (!student || !guardian || !via) continue;
    recipients.push({ name: guardian.name, phone: guardian.phone, channel: via, text: renderTemplate(template.body, { name: guardian.name, student: student.name, school: db.campusProfile.schoolName, ...vars(id) }) });
  }
  db.messages = [
    {
      id: newId("msg"),
      branchId,
      at: new Date().toISOString(),
      by: mockActor(),
      audience,
      channel,
      template: template.name,
      recipients,
      smsSegments: recipients.filter((r) => r.channel === "sms").reduce((n, r) => n + smsSegments(r.text), 0),
      cost: recipients.reduce((n, r) => n + messageCost(r.channel, r.text), 0),
    },
    ...db.messages,
  ];
}

/** A short unique id for records created in the browser. */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;


const today = () => localISODate();

/** Initials from a name, ignoring titles: "Dr. Tariq Mahmood" -> "TM". */
export const initialsOf = (name: string) =>
  name
    .replace(/^(Dr|Mr|Mrs|Ms|Sir)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Adds an entry to a student's activity log. */
function logActivity(studentId: string, text: string) {
  db.studentActivity = [
    { id: newId("act"), studentId, at: new Date().toISOString(), actor: mockActor(), text },
    ...db.studentActivity,
  ];
}

const placement = (classId: string, sectionId: string) => {
  const cls = db.classes.find((c) => c.id === classId);
  const section = db.sections.find((s) => s.id === sectionId);
  return `${cls?.name ?? "a class"}, section ${section?.name ?? "?"}`;
};

/** Checks a class and section exist and belong together. */
function checkPlacement(classId: string, sectionId: string, branchId?: string) {
  const cls = db.classes.find((c) => c.id === classId);
  const section = db.sections.find((s) => s.id === sectionId);
  if (!cls || !section || section.classId !== classId) return "Choose a class and one of its sections";
  if (branchId && cls.branchId !== branchId) return "That class is at a different campus";
  return null;
}

/** Builds a new student record from admission details. */
function createStudent(input: AdmissionInput, index = 0): Student {
  const nextRoll = Math.max(...db.students.map((s) => Number(s.id.replace(/\D/g, "")) || 0)) + 1 + index;
  const year = input.admissionDate.slice(0, 4);
  const inYear = db.students.filter((s) => s.admissionNo.startsWith(`ADM-${year}`)).length + 1 + index;
  return {
    ...input,
    id: `STD-${nextRoll}`,
    admissionNo: `ADM-${year}-${String(inYear).padStart(4, "0")}`,
    avatar: initialsOf(input.name),
    siblingIds: input.siblingIds ?? [],
    enrollment: "active",
    feeStatus: "clear",
    attendance: 100,
    balance: 0,
    documents: [],
  };
}

/** Recomputes balance and fee status for students whose vouchers changed. */
function syncFees(studentIds: string[]) {
  const ids = new Set(studentIds);
  db.students = db.students.map((s) => (ids.has(s.id) ? { ...s, ...feeStanding(s.id, db.vouchers) } : s));
}

/** Replaces one student record. */
const putStudent = (student: Student) => {
  db.students = db.students.map((s) => (s.id === student.id ? student : s));
  return student;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ status: number; message: string }>(),
  tagTypes: ["Voucher", "Session", "Branch", "User", "Class", "Section", "Subject", "ClassSubject", "Permissions", "Rules", "Campus", "Student", "StudentActivity", "Register", "UnlockRequest", "StaffAttendance", "Payment", "FeeStructure", "DayClosing", "FeeReminder", "Staff", "Allocation", "Payroll", "Exam", "Message", "Paper", "Tenant"],
  // Demo data never goes stale; keep it for the whole visit.
  keepUnusedDataFor: 60 * 60 * 24,
  endpoints: (build) => ({
    getUsers: build.query<MockDb["users"], void>(readOr("getUsers", "users", "User", "/users")),
    getBranches: build.query<MockDb["branches"], void>(readOr("getBranches", "branches", "Branch", "/branches")),
    getSessions: build.query<MockDb["sessions"], void>(readOr("getSessions", "sessions", "Session", "/sessions")),
    getStudents: build.query<MockDb["students"], void>(readOr("getStudents", "students", "Student", "/students")),
    getStudentActivity: build.query<MockDb["studentActivity"], void>(readOr("getStudentActivity", "studentActivity", "StudentActivity", "/students/activity")),
    getRegisters: build.query<MockDb["registers"], void>(readOr("getRegisters", "registers", "Register", "/registers")),
    getUnlockRequests: build.query<MockDb["unlockRequests"], void>(readOr("getUnlockRequests", "unlockRequests", "UnlockRequest", "/unlock-requests")),
    getStaffAttendance: build.query<MockDb["staffAttendance"], void>(readOr("getStaffAttendance", "staffAttendance", "StaffAttendance", "/staff-attendance")),
    getVouchers: build.query<MockDb["vouchers"], void>(readOr("getVouchers", "vouchers", "Voucher", "/vouchers")),
    getPayments: build.query<MockDb["payments"], void>(readOr("getPayments", "payments", "Payment", "/payments")),
    getFeeHeads: build.query<MockDb["feeHeads"], void>(readOr("getFeeHeads", "feeHeads", "FeeStructure", "/fee-heads")),
    getFeePlans: build.query<MockDb["feePlans"], void>(readOr("getFeePlans", "feePlans", "FeeStructure", "/fee-plans")),
    getConcessions: build.query<MockDb["concessions"], void>(readOr("getConcessions", "concessions", "FeeStructure", "/concessions")),
    getDayClosings: build.query<MockDb["dayClosings"], void>(readOr("getDayClosings", "dayClosings", "DayClosing", "/day-closings")),
    getFeeReminders: build.query<MockDb["feeReminders"], void>(readOr("getFeeReminders", "feeReminders", "FeeReminder", "/fee-reminders")),
    getStaff: build.query<MockDb["staff"], void>(read("staff", "Staff")),
    getAllocations: build.query<MockDb["allocations"], void>(read("allocations", "Allocation")),
    getTeachers: build.query<MockDb["teachers"], void>(read("teachers", "Staff")),
    getPayrollRuns: build.query<MockDb["payrollRuns"], void>(read("payrollRuns", "Payroll")),
    getPayslips: build.query<MockDb["payslips"], void>(read("payslips", "Payroll")),
    getAdvances: build.query<MockDb["advances"], void>(read("advances", "Payroll")),
    getExams: build.query<MockDb["exams"], void>(read("exams", "Exam")),
    getExamPapers: build.query<MockDb["examPapers"], void>(read("examPapers", "Exam")),
    getExamMarks: build.query<MockDb["examMarks"], void>(read("examMarks", "Exam")),
    getMessages: build.query<MockDb["messages"], void>(read("messages", "Message")),
    getMessageTemplates: build.query<MockDb["messageTemplates"], void>(read("messageTemplates", "Message")),
    getCampusProfile: build.query<MockDb["campusProfile"], void>(readOr("getCampusProfile", "campusProfile", "Campus", "/settings/campus-profile")),
    getRolePermissions: build.query<MockDb["rolePermissions"], void>(readOr("getRolePermissions", "rolePermissions", "Permissions", "/settings/permissions")),
    getSchoolRules: build.query<MockDb["schoolRules"], void>(readOr("getSchoolRules", "schoolRules", "Rules", "/settings/rules")),
    getClasses: build.query<MockDb["classes"], void>(readOr("getClasses", "classes", "Class", "/classes")),
    getSections: build.query<MockDb["sections"], void>(readOr("getSections", "sections", "Section", "/sections")),
    getSubjects: build.query<MockDb["subjects"], void>(readOr("getSubjects", "subjects", "Subject", "/subjects")),
    getClassSubjects: build.query<MockDb["classSubjects"], void>(readOr("getClassSubjects", "classSubjects", "ClassSubject", "/class-subjects")),
    // Paper maker: every call goes through the paper service contract (services/paper).
    getPaperCatalog: build.query<PaperCatalog, void>({ queryFn: () => mockPaperService.getCatalog(paperCaller()), providesTags: ["Paper"] }),
    getQuestionBank: build.query<BankQuestion[], void>({
      queryFn: () => mockPaperService.getQuestionBank(paperCaller(), db.paperCatalog.subTopics.map((t) => t.id)),
      providesTags: ["Paper"],
    }),
    getMyTenant: build.query<Tenant, string>({
      // The real API returns the caller's own school; the mock follows the tenant the Console is viewing as.
      queryFn: apiOr<string, Tenant>("getMyTenant", (tenantId) => mockTenantService.getMyTenant(platformCaller(tenantId)), () => ({ url: "/tenant" })),
      providesTags: ["Tenant"],
    }),
    getTenants: build.query<Tenant[], void>({ queryFn: () => mockTenantService.listTenants(platformCaller()), providesTags: ["Tenant"] }),
    getPapers: build.query<Paper[], void>({ queryFn: () => mockPaperService.listPapers(paperCaller()), providesTags: ["Paper"] }),
    getPrintablePaper: build.query<Paper, { id: string; answerKey: boolean }>({
      queryFn: ({ id, answerKey }) => mockPaperService.getPrintable(paperCaller(), id, answerKey),
      providesTags: ["Paper"],
    }),
    getTeacherDay: build.query<MockDb["teacherDay"], void>(read("teacherDay")),

    /** Records a full or partial payment against a voucher, with any late fine on top. */
    recordPayment: build.mutation<Payment, PaymentInput>({
      queryFn: apiOr("recordPayment", ({ voucherId, amount, method, lateFine }: PaymentInput) => {
        const voucher = db.vouchers.find((v) => v.id === voucherId);
        if (!voucher) return fail(404, "Voucher not found");
        if (voucher.status === "cancelled") return fail(409, "This voucher was cancelled");
        const due = voucherBalance(voucher);
        if (due === 0) return fail(409, "This voucher is already paid");
        if (!Number.isInteger(amount) || amount <= 0) return fail(400, "Enter the amount received in whole rupees");
        if (amount > due) return fail(400, `Only Rs ${due.toLocaleString("en-US")} is due on this voucher`);
        const payment: Payment = {
          id: newId("pay"),
          receiptNo: `REC-${String(db.payments.length + 1).padStart(5, "0")}`,
          voucherId,
          studentId: voucher.studentId,
          branchId: voucher.branchId,
          amount,
          lateFine: Math.max(0, lateFine),
          method,
          at: new Date().toISOString(),
          by: mockActor(),
        };
        db.payments = [...db.payments, payment];
        db.vouchers = db.vouchers.map((v) => (v.id === voucherId ? settleVoucher(v, db.payments) : v));
        syncFees([voucher.studentId]);
        logActivity(voucher.studentId, `Paid Rs ${amount.toLocaleString("en-US")}${payment.lateFine ? ` plus Rs ${payment.lateFine.toLocaleString("en-US")} late fine` : ""} in ${method}, receipt ${payment.receiptNo}.`);
        return { data: payment };
      }, (input) => ({ url: "/payments", method: "POST", body: input })),
      invalidatesTags: ["Voucher", "Payment", "Student", "StudentActivity"],
    }),
    /** Undoes a payment, with a reason. The receipt stays on record, marked reversed. */
    reversePayment: build.mutation<null, { id: string; reason: string }>({
      queryFn: apiOr("reversePayment", ({ id, reason }: { id: string; reason: string }) => {
        if (reason.trim().length < 10) return fail(400, "Explain why the payment is being reversed.");
        const payment = db.payments.find((p) => p.id === id);
        if (!payment) return fail(404, "Payment not found");
        if (payment.reversed) return fail(409, "This payment was already reversed");
        if (db.dayClosings.some((c) => c.branchId === payment.branchId && c.date === payment.at.slice(0, 10)))
          return fail(409, "That day is closed. Record a correction on today's date instead.");
        db.payments = db.payments.map((p) => (p.id === id ? { ...p, reversed: { at: new Date().toISOString(), by: mockActor(), reason: reason.trim() } } : p));
        db.vouchers = db.vouchers.map((v) => (v.id === payment.voucherId ? settleVoucher(v, db.payments) : v));
        syncFees([payment.studentId]);
        logActivity(payment.studentId, `Receipt ${payment.receiptNo} reversed: ${reason.trim()}`);
        return { data: null };
      }, ({ id, reason }) => ({ url: `/payments/${id}/reverse`, method: "POST", body: { reason } })),
      invalidatesTags: ["Voucher", "Payment", "Student", "StudentActivity"],
    }),
    /** Creates a month's vouchers for the students given; students who already have one are skipped. */
    generateVouchers: build.mutation<{ created: number; skipped: number }, { month: string; dueDate: string; studentIds: string[] }>({
      queryFn: apiOr("generateVouchers", ({ month, dueDate, studentIds }: { month: string; dueDate: string; studentIds: string[] }) => {
        if (!/^\d{4}-\d{2}$/.test(month)) return fail(400, "Choose a month");
        if (!dueDate.startsWith(month)) return fail(400, "The due date should fall in the billing month");
        const issueDate = localISODate();
        let skipped = 0;
        const created: FeeVoucher[] = [];
        for (const id of studentIds) {
          const student = db.students.find((s) => s.id === id && s.enrollment === "active");
          if (!student || db.vouchers.some((v) => v.studentId === id && v.month === month && v.status !== "cancelled")) {
            skipped++;
            continue;
          }
          const plan = db.feePlans.find((p) => p.classId === student.classId);
          const voucher = buildVoucher(student, month, plan, db.feeHeads, { issueDate, dueDate });
          created.push(db.vouchers.some((v) => v.id === voucher.id) ? { ...voucher, id: newId("vch") } : voucher);
        }
        db.vouchers = [...db.vouchers, ...created];
        syncFees(created.map((v) => v.studentId));
        return { data: { created: created.length, skipped } };
      }, (body) => ({ url: "/vouchers/generate", method: "POST", body })),
      invalidatesTags: ["Voucher", "Student"],
    }),
    cancelVoucher: build.mutation<null, { id: string; reason: string }>({
      queryFn: apiOr("cancelVoucher", ({ id, reason }: { id: string; reason: string }) => {
        if (reason.trim().length < 5) return fail(400, "Give a reason for cancelling.");
        const voucher = db.vouchers.find((v) => v.id === id);
        if (!voucher) return fail(404, "Voucher not found");
        if (voucher.paidAmount > 0) return fail(409, "Payments were taken on this voucher. Reverse them first.");
        db.vouchers = db.vouchers.map((v) => (v.id === id ? { ...v, status: "cancelled", cancelled: { at: new Date().toISOString(), by: mockActor(), reason: reason.trim() } } : v));
        syncFees([voucher.studentId]);
        logActivity(voucher.studentId, `Voucher ${voucher.voucherNumber} cancelled: ${reason.trim()}`);
        return { data: null };
      }, ({ id, reason }) => ({ url: `/vouchers/${id}/cancel`, method: "POST", body: { reason } })),
      invalidatesTags: ["Voucher", "Student", "StudentActivity"],
    }),
    saveFeeHead: build.mutation<FeeHead, FeeHead>({
      queryFn: apiOr("saveFeeHead", (head: FeeHead) => {
        if (!head.name.trim()) return fail(400, "Give the fee head a name");
        if (db.feeHeads.some((h) => h.id !== head.id && h.name.toLowerCase() === head.name.trim().toLowerCase()))
          return fail(409, `${head.name} already exists`);
        const saved = { ...head, name: head.name.trim() };
        db.feeHeads = db.feeHeads.some((h) => h.id === head.id) ? db.feeHeads.map((h) => (h.id === head.id ? saved : h)) : [...db.feeHeads, saved];
        return { data: saved };
      }, (head) => ({ url: "/fee-heads", method: "PUT", body: head })),
      invalidatesTags: ["FeeStructure"],
    }),
    removeFeeHead: build.mutation<null, string>({
      queryFn: apiOr("removeFeeHead", (id: string) => {
        if (id === "tuition") return fail(400, "Tuition can't be removed");
        db.feeHeads = db.feeHeads.filter((h) => h.id !== id);
        db.feePlans = db.feePlans.map((p) => {
          const { [id]: _removed, ...amounts } = p.amounts;
          void _removed;
          return { ...p, amounts };
        });
        return { data: null };
      }, (id) => ({ url: `/fee-heads/${id}`, method: "DELETE" })),
      invalidatesTags: ["FeeStructure"],
    }),
    saveFeePlan: build.mutation<FeePlan, FeePlan>({
      queryFn: apiOr("saveFeePlan", (plan: FeePlan) => {
        if (Object.values(plan.amounts).some((a) => !Number.isInteger(a) || a < 0)) return fail(400, "Amounts must be whole rupees");
        db.feePlans = db.feePlans.some((p) => p.id === plan.id) ? db.feePlans.map((p) => (p.id === plan.id ? plan : p)) : [...db.feePlans, plan];
        return { data: plan };
      }, (plan) => ({ url: "/fee-plans", method: "PUT", body: plan })),
      invalidatesTags: ["FeeStructure"],
    }),
    saveConcession: build.mutation<Concession, Concession>({
      queryFn: apiOr("saveConcession", (c: Concession) => {
        if (!c.name.trim()) return fail(400, "Give the concession a name");
        if (!(c.percent > 0 && c.percent <= 100)) return fail(400, "The discount must be between 1 and 100%");
        const saved = { ...c, name: c.name.trim() };
        db.concessions = db.concessions.some((x) => x.id === c.id) ? db.concessions.map((x) => (x.id === c.id ? saved : x)) : [...db.concessions, saved];
        return { data: saved };
      }, (c) => ({ url: "/concessions", method: "PUT", body: c })),
      invalidatesTags: ["FeeStructure"],
    }),
    removeConcession: build.mutation<null, string>({
      queryFn: apiOr("removeConcession", (id: string) => {
        db.concessions = db.concessions.filter((c) => c.id !== id);
        return { data: null };
      }, (id) => ({ url: `/concessions/${id}`, method: "DELETE" })),
      invalidatesTags: ["FeeStructure"],
    }),
    sendFeeReminders: build.mutation<null, string[]>({
      queryFn: apiOr("sendFeeReminders", (studentIds: string[]) => {
        const at = new Date().toISOString();
        db.feeReminders = [...db.feeReminders, ...studentIds.map((studentId) => ({ id: newId("rem"), studentId, at, by: mockActor() }))];
        for (const id of studentIds) logActivity(id, "Fee reminder sent by SMS.");
        const branchId = db.students.find((x) => x.id === studentIds[0])?.branchId ?? "";
        logGuardianMessage(branchId, studentIds, "tpl-fee", studentIds.length === 1 ? "Fee reminder" : `Fee reminders (${studentIds.length} families)`, (id) => {
          const owed = db.vouchers.filter((v) => v.studentId === id).reduce((n, v) => n + voucherBalance(v), 0);
          return { amount: `Rs ${owed.toLocaleString("en-PK")}` };
        });
        return { data: null };
      }, (studentIds) => ({ url: "/fee-reminders", method: "POST", body: studentIds })),
      invalidatesTags: ["FeeReminder", "StudentActivity", "Message"],
    }),
    /** Closes a day's collections at a campus. After this, that day's payments can't be reversed. */
    closeDay: build.mutation<DayClosing, Omit<DayClosing, "id" | "closedAt" | "closedBy">>({
      queryFn: apiOr("closeDay", (input: Omit<DayClosing, "id" | "closedAt" | "closedBy">) => {
        if (db.dayClosings.some((c) => c.branchId === input.branchId && c.date === input.date)) return fail(409, "This day is already closed");
        if (!Number.isInteger(input.cashCounted) || input.cashCounted < 0) return fail(400, "Enter the cash counted in whole rupees");
        const closing: DayClosing = { ...input, id: newId("close"), closedAt: new Date().toISOString(), closedBy: mockActor() };
        db.dayClosings = [...db.dayClosings, closing];
        return { data: closing };
      }, (input) => ({ url: "/day-closings", method: "POST", body: input })),
      invalidatesTags: ["DayClosing"],
    }),

    // Attendance -------------------------------------------------------------
    /** Saves a register. Resubmitting a reopened register records each change and locks it again. */
    submitRegister: build.mutation<
      AttendanceRegister,
      Pick<AttendanceRegister, "branchId" | "classId" | "sectionId" | "date" | "subjectId" | "marks">
    >({
      queryFn: apiOr("submitRegister", (input: Pick<AttendanceRegister, "branchId" | "classId" | "sectionId" | "date" | "subjectId" | "marks">) => {
        const id = input.subjectId ? `${input.sectionId}:${input.date}:${input.subjectId}` : `${input.sectionId}:${input.date}`;
        const existing = db.registers.find((r) => r.id === id);
        const now = new Date().toISOString();
        if (existing?.lockedAt && !existing.reopened) return fail(409, "This register is locked. Ask a branch admin to reopen it.");
        if (!existing) {
          const created: AttendanceRegister = { ...input, id, submittedAt: now, submittedBy: mockActor(), changes: [] };
          db.registers = [...db.registers, created];
          return { data: created };
        }
        const changes: RegisterChange[] = Object.entries(input.marks)
          .filter(([studentId, mark]) => existing.marks[studentId] && existing.marks[studentId].status !== mark.status)
          .map(([studentId, mark]) => ({
            at: now,
            by: mockActor(),
            studentId,
            from: existing.marks[studentId].status,
            to: mark.status,
            reason: existing.reopened?.reason ?? "",
          }));
        const updated: AttendanceRegister = {
          ...existing,
          marks: input.marks,
          submittedAt: now,
          submittedBy: mockActor(),
          changes: [...existing.changes, ...changes],
          ...(existing.reopened ? { lockedAt: now, lockedBy: mockActor(), reopened: undefined } : {}),
        };
        db.registers = db.registers.map((r) => (r.id === id ? updated : r));
        return { data: updated };
      }, (input) => ({ url: "/registers", method: "PUT", body: input })),
      invalidatesTags: ["Register"],
    }),
    lockRegisters: build.mutation<null, string[]>({
      queryFn: apiOr("lockRegisters", (ids: string[]) => {
        const now = new Date().toISOString();
        db.registers = db.registers.map((r) =>
          ids.includes(r.id) && !r.lockedAt ? { ...r, lockedAt: now, lockedBy: mockActor(), reopened: undefined } : r
        );
        return { data: null };
      }, (ids) => ({ url: "/registers/lock", method: "POST", body: ids })),
      invalidatesTags: ["Register"],
    }),
    /** Reopens a locked register so it can be corrected. Only branch admins; a reason is required. */
    unlockRegister: build.mutation<null, { id: string; reason: string }>({
      queryFn: apiOr("unlockRegister", ({ id, reason }: { id: string; reason: string }) => {
        if (reason.trim().length < 10) return fail(400, "Explain why the register needs changing (at least a short sentence).");
        const register = db.registers.find((r) => r.id === id);
        if (!register) return fail(404, "Register not found");
        const now = new Date().toISOString();
        db.registers = db.registers.map((r) =>
          r.id === id ? { ...r, lockedAt: undefined, lockedBy: undefined, reopened: { at: now, by: mockActor(), reason: reason.trim() } } : r
        );
        db.unlockRequests = db.unlockRequests.map((u) =>
          u.registerId === id && u.status === "pending" ? { ...u, status: "approved", decidedBy: mockActor(), decidedAt: now } : u
        );
        return { data: null };
      }, ({ id, reason }) => ({ url: `/registers/${id}/unlock`, method: "POST", body: { reason } })),
      invalidatesTags: ["Register", "UnlockRequest"],
    }),
    requestUnlock: build.mutation<UnlockRequest, { registerId: string; reason: string }>({
      queryFn: apiOr("requestUnlock", ({ registerId, reason }: { registerId: string; reason: string }) => {
        if (reason.trim().length < 10) return fail(400, "Explain what needs changing (at least a short sentence).");
        if (db.unlockRequests.some((u) => u.registerId === registerId && u.status === "pending"))
          return fail(409, "A request to reopen this register is already waiting.");
        const request: UnlockRequest = {
          id: newId("unlock"),
          registerId,
          reason: reason.trim(),
          requestedBy: mockActor(),
          requestedAt: new Date().toISOString(),
          status: "pending",
        };
        db.unlockRequests = [request, ...db.unlockRequests];
        return { data: request };
      }, (body) => ({ url: "/unlock-requests", method: "POST", body })),
      invalidatesTags: ["UnlockRequest"],
    }),
    decideUnlock: build.mutation<null, { id: string; approve: boolean }>({
      queryFn: apiOr("decideUnlock", ({ id, approve }: { id: string; approve: boolean }) => {
        const request = db.unlockRequests.find((u) => u.id === id);
        if (!request || request.status !== "pending") return fail(404, "This request was already handled");
        const now = new Date().toISOString();
        db.unlockRequests = db.unlockRequests.map((u) =>
          u.id === id ? { ...u, status: approve ? "approved" : "declined", decidedBy: mockActor(), decidedAt: now } : u
        );
        if (approve) {
          db.registers = db.registers.map((r) =>
            r.id === request.registerId
              ? { ...r, lockedAt: undefined, lockedBy: undefined, reopened: { at: now, by: mockActor(), reason: `${request.reason} (requested by ${request.requestedBy})` } }
              : r
          );
        }
        return { data: null };
      }, ({ id, approve }) => ({ url: `/unlock-requests/${id}/decision`, method: "POST", body: { approve } })),
      invalidatesTags: ["Register", "UnlockRequest"],
    }),
    markAlertsSent: build.mutation<null, string[]>({
      queryFn: apiOr("markAlertsSent", (ids: string[]) => {
        const now = new Date().toISOString();
        db.registers = db.registers.map((r) => (ids.includes(r.id) ? { ...r, alertsSentAt: now } : r));
        for (const r of db.registers.filter((x) => ids.includes(x.id))) {
          const absent = Object.entries(r.marks).filter(([, m]) => m.status === "absent").map(([id]) => id);
          const cls = db.classes.find((c) => c.id === r.classId)?.name ?? "";
          const section = db.sections.find((x) => x.id === r.sectionId)?.name ?? "";
          const date = new Date(`${r.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          logGuardianMessage(r.branchId, absent, "tpl-absent", `Absence alerts, ${cls} ${section}`, () => ({ class: `${cls} ${section}`, date }));
        }
        return { data: null };
      }, (ids) => ({ url: "/registers/alerts", method: "POST", body: ids })),
      invalidatesTags: ["Register", "Message"],
    }),
    saveStaffAttendance: build.mutation<StaffAttendanceDay, Pick<StaffAttendanceDay, "branchId" | "date" | "marks">>({
      queryFn: apiOr("saveStaffAttendance", (input: Pick<StaffAttendanceDay, "branchId" | "date" | "marks">) => {
        const day: StaffAttendanceDay = { ...input, id: `${input.branchId}:${input.date}`, savedAt: new Date().toISOString(), savedBy: mockActor() };
        db.staffAttendance = [...db.staffAttendance.filter((d) => d.id !== day.id), day];
        return { data: day };
      }, ({ date, ...body }) => ({ url: `/staff-attendance/${date}`, method: "PUT", body })),
      invalidatesTags: ["StaffAttendance"],
    }),

    // Staff and allocations --------------------------------------------------
    /** Adds a staff member (no id yet) or updates one. */
    saveStaff: build.mutation<StaffMember, Omit<StaffMember, "id" | "staffId" | "avatar"> & { id?: string }>({
      queryFn: (input) => {
        if (input.name.trim().length < 3) return fail(400, "Enter the full name");
        if (db.staff.some((m) => m.id !== input.id && m.email.toLowerCase() === input.email.toLowerCase()))
          return fail(409, `${input.email} belongs to another staff member`);
        if (input.cnic && db.staff.some((m) => m.id !== input.id && m.cnic === input.cnic)) return fail(409, "Another staff member has this CNIC");
        const existing = db.staff.find((m) => m.id === input.id);
        const nextNo = Math.max(...db.staff.map((m) => Number(m.staffId.replace(/\D/g, "")) || 0)) + 1;
        const saved: StaffMember = {
          ...(existing ?? {}),
          ...input,
          id: existing?.id ?? newId("st"),
          staffId: existing?.staffId ?? `STF-${nextNo}`,
          avatar: initialsOf(input.name),
          name: input.name.trim(),
        } as StaffMember;
        db.staff = existing ? db.staff.map((m) => (m.id === saved.id ? saved : m)) : [...db.staff, saved];
        db.teachers = teachersFrom(db.staff);
        return { data: saved };
      },
      invalidatesTags: ["Staff"],
    }),
    /** On leave, back to active, or left (which also frees their allocations). */
    setStaffStatus: build.mutation<null, { id: string; status: StaffMember["status"]; date?: string; reason?: string }>({
      queryFn: ({ id, status, date, reason }) => {
        const member = db.staff.find((m) => m.id === id);
        if (!member) return fail(404, "Staff member not found");
        if (status === "terminated" && (!date || !reason?.trim())) return fail(400, "Enter the leaving date and reason");
        db.staff = db.staff.map((m) =>
          m.id === id ? { ...m, status, ...(status === "terminated" ? { left: { date: date!, reason: reason!.trim() } } : { left: undefined }) } : m
        );
        if (status === "terminated") {
          db.allocations = db.allocations.filter((a) => a.teacherId !== member.staffId);
          db.sections = db.sections.map((s) => (s.inchargeId === member.staffId ? { ...s, inchargeId: undefined } : s));
        }
        db.teachers = teachersFrom(db.staff);
        return { data: null };
      },
      invalidatesTags: ["Staff", "Allocation", "Section"],
    }),
    /** Sets who teaches a subject to a section (teacherId null clears it), and its periods. */
    setAllocation: build.mutation<TeacherAllocation | null, { classId: string; sectionId: string; subjectId: string; teacherId: string | null; weeklyPeriods?: number }>({
      queryFn: ({ classId, sectionId, subjectId, teacherId, weeklyPeriods }) => {
        const existing = db.allocations.find((a) => a.sectionId === sectionId && a.subjectId === subjectId);
        if (!teacherId) {
          db.allocations = db.allocations.filter((a) => a !== existing);
          return { data: null };
        }
        const teacher = db.staff.find((m) => m.staffId === teacherId);
        if (!teacher || !teacher.teaches || teacher.status === "terminated") return fail(400, "Choose a current teacher");
        if (weeklyPeriods !== undefined && (!Number.isInteger(weeklyPeriods) || weeklyPeriods < 1 || weeklyPeriods > 12))
          return fail(400, "Periods a week should be between 1 and 12");
        const saved: TeacherAllocation = existing
          ? { ...existing, teacherId, weeklyPeriods: weeklyPeriods ?? existing.weeklyPeriods }
          : { id: newId("alc"), teacherId, subjectId, classId, sectionId, weeklyPeriods: weeklyPeriods ?? 6 };
        db.allocations = existing ? db.allocations.map((a) => (a === existing ? saved : a)) : [...db.allocations, saved];
        return { data: saved };
      },
      invalidatesTags: ["Allocation"],
    }),

    // Payroll ----------------------------------------------------------------
    /** Starts a month's payroll: a draft payslip for everyone on staff, with absences from staff attendance. */
    startPayroll: build.mutation<PayrollRun, { branchId: string; month: string }>({
      queryFn: ({ branchId, month }) => {
        if (db.payrollRuns.some((r) => r.branchId === branchId && r.month === month)) return fail(409, "Payroll for this month has already started");
        const run: PayrollRun = { id: newId("run"), branchId, month, status: "draft", createdAt: new Date().toISOString(), createdBy: mockActor() };
        const members = db.staff.filter((m) => m.branchId === branchId && (m.status !== "terminated" || (m.left && m.left.date >= `${month}-01`)));
        const slips = members.map((m) => {
          const absentDays = db.staffAttendance
            .filter((d) => d.branchId === branchId && d.date.startsWith(month))
            .filter((d) => d.marks[m.staffId] === "absent").length;
          const advance = db.advances.find((a) => a.staffId === m.staffId && a.recovered < a.amount);
          const advanceRecovery = advance ? Math.min(advance.monthlyRecovery, advance.amount - advance.recovered) : 0;
          return computePayslip(
            m,
            { id: newId("slip"), runId: run.id, month, status: "draft" },
            { absentDays, adjustments: [], advanceRecovery, periodsPerWeek: periodsOf(m.staffId, db.allocations) }
          );
        });
        db.payrollRuns = [...db.payrollRuns, run];
        db.payslips = [...db.payslips, ...slips];
        return { data: run };
      },
      invalidatesTags: ["Payroll"],
    }),
    /** Changes a draft payslip's absences or one-off adjustments and recalculates it. */
    updatePayslip: build.mutation<Payslip, { id: string; absentDays: number; adjustments: SalaryComponent[] }>({
      queryFn: ({ id, absentDays, adjustments }) => {
        const slip = db.payslips.find((p) => p.id === id);
        if (!slip) return fail(404, "Payslip not found");
        const run = db.payrollRuns.find((r) => r.id === slip.runId);
        if (run?.status !== "draft") return fail(409, "This payroll is finalised; payslips can't change");
        if (!Number.isInteger(absentDays) || absentDays < 0 || absentDays > 31) return fail(400, "Absent days should be between 0 and 31");
        if (adjustments.some((a) => !a.label.trim() || !Number.isInteger(a.amount) || a.amount === 0)) return fail(400, "Each adjustment needs a label and an amount");
        const member = db.staff.find((m) => m.staffId === slip.staffId);
        if (!member) return fail(404, "Staff member not found");
        const updated = computePayslip(member, slip, { absentDays, adjustments, advanceRecovery: slip.advanceRecovery, periodsPerWeek: slip.periodsPerWeek });
        db.payslips = db.payslips.map((p) => (p.id === id ? updated : p));
        return { data: updated };
      },
      invalidatesTags: ["Payroll"],
    }),
    finalisePayroll: build.mutation<null, string>({
      queryFn: (runId) => {
        const run = db.payrollRuns.find((r) => r.id === runId);
        if (!run || run.status !== "draft") return fail(409, "Only a draft payroll can be finalised");
        db.payrollRuns = db.payrollRuns.map((r) => (r.id === runId ? { ...r, status: "finalised", finalisedAt: new Date().toISOString() } : r));
        return { data: null };
      },
      invalidatesTags: ["Payroll"],
    }),
    /** Marks payslips paid and takes their advance recoveries off the advances. */
    markPayslipsPaid: build.mutation<null, { ids: string[]; method: NonNullable<Payslip["method"]> }>({
      queryFn: ({ ids, method }) => {
        const slips = db.payslips.filter((p) => ids.includes(p.id) && p.status === "draft");
        if (slips.some((p) => db.payrollRuns.find((r) => r.id === p.runId)?.status === "draft")) return fail(409, "Finalise the payroll before paying");
        const paidAt = new Date().toISOString();
        db.payslips = db.payslips.map((p) => (slips.includes(p) ? { ...p, status: "paid", paidAt, method } : p));
        for (const p of slips) {
          if (!p.advanceRecovery) continue;
          db.advances = db.advances.map((a) =>
            a.staffId === p.staffId && a.recovered < a.amount ? { ...a, recovered: Math.min(a.amount, a.recovered + p.advanceRecovery) } : a
          );
        }
        const runIds = new Set(slips.map((p) => p.runId));
        db.payrollRuns = db.payrollRuns.map((r) =>
          runIds.has(r.id) && db.payslips.filter((p) => p.runId === r.id).every((p) => p.status === "paid") ? { ...r, status: "paid" } : r
        );
        return { data: null };
      },
      invalidatesTags: ["Payroll"],
    }),
    addAdvance: build.mutation<Advance, Omit<Advance, "id" | "recovered">>({
      queryFn: (input) => {
        if (!Number.isInteger(input.amount) || input.amount <= 0) return fail(400, "Enter the advance in whole rupees");
        if (!Number.isInteger(input.monthlyRecovery) || input.monthlyRecovery <= 0 || input.monthlyRecovery > input.amount)
          return fail(400, "Monthly recovery should be more than 0 and no more than the advance");
        if (!input.reason.trim()) return fail(400, "Give a reason");
        if (db.advances.some((a) => a.staffId === input.staffId && a.recovered < a.amount)) return fail(409, "This person is still repaying an advance");
        const advance: Advance = { ...input, id: newId("adv"), recovered: 0, reason: input.reason.trim() };
        db.advances = [...db.advances, advance];
        return { data: advance };
      },
      invalidatesTags: ["Payroll"],
    }),

    // Exams ------------------------------------------------------------------
    saveExam: build.mutation<Exam, Omit<Exam, "id" | "createdBy" | "publishedAt"> & { id?: string }>({
      queryFn: (input) => {
        const title = input.title.trim();
        if (title.length < 3) return fail(400, "Enter the exam name");
        if (!input.startDate || !input.endDate) return fail(400, "Enter the start and end dates");
        if (input.endDate < input.startDate) return fail(400, "The end date must be on or after the start date");
        if (input.classIds.length === 0) return fail(400, "Choose at least one class");
        const existing = input.id ? db.exams.find((e) => e.id === input.id) : undefined;
        if (input.id && !existing) return fail(404, "Exam not found");
        if (existing?.publishedAt) return fail(409, "Results are published; unpublish them to change this exam");
        if (db.exams.some((e) => e.id !== input.id && e.branchId === input.branchId && e.title.toLowerCase() === title.toLowerCase()))
          return fail(409, "An exam with this name already exists");
        if (existing) {
          const dropped = existing.classIds.filter((c) => !input.classIds.includes(c));
          const droppedMarks = db.examMarks.filter((m) => m.examId === existing.id && dropped.includes(db.students.find((s) => s.id === m.studentId)?.classId ?? ""));
          if (droppedMarks.length) return fail(409, "Marks are entered for a class you removed; keep that class or delete its marks first");
          const outside = db.examPapers.filter((p) => p.examId === existing.id && input.classIds.includes(p.classId) && (p.date < input.startDate || p.date > input.endDate));
          if (outside.length) return fail(409, `${outside.length} date sheet papers fall outside the new dates; move them first`);
          db.examPapers = db.examPapers.filter((p) => !(p.examId === existing.id && dropped.includes(p.classId)));
        }
        const saved: Exam = existing
          ? { ...existing, ...input, title, id: existing.id }
          : { ...input, title, id: newId("ex"), createdBy: mockActor() };
        db.exams = existing ? db.exams.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...db.exams];
        return { data: saved };
      },
      invalidatesTags: ["Exam"],
    }),
    /** Deletes an exam with its date sheet and marks. */
    deleteExam: build.mutation<null, string>({
      queryFn: (id) => {
        const exam = db.exams.find((e) => e.id === id);
        if (!exam) return fail(404, "Exam not found");
        if (exam.publishedAt) return fail(409, "Results are published; unpublish them before deleting");
        db.exams = db.exams.filter((e) => e.id !== id);
        db.examPapers = db.examPapers.filter((p) => p.examId !== id);
        db.examMarks = db.examMarks.filter((m) => m.examId !== id);
        return { data: null };
      },
      invalidatesTags: ["Exam"],
    }),
    /** Replaces one class's date sheet for an exam. */
    saveDateSheet: build.mutation<ExamPaper[], { examId: string; classId: string; papers: Pick<ExamPaper, "subjectId" | "date" | "totalMarks" | "passMarks">[] }>({
      queryFn: ({ examId, classId, papers }) => {
        const exam = db.exams.find((e) => e.id === examId);
        if (!exam) return fail(404, "Exam not found");
        if (exam.publishedAt) return fail(409, "Results are published; the date sheet can't change");
        const subjectName = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "a subject";
        for (const p of papers) {
          if (!p.date || p.date < exam.startDate || p.date > exam.endDate) return fail(400, `${subjectName(p.subjectId)}: the date must fall within the exam dates`);
          if (!Number.isInteger(p.totalMarks) || p.totalMarks < 1 || p.totalMarks > 1000) return fail(400, `${subjectName(p.subjectId)}: total marks should be between 1 and 1000`);
          if (!Number.isInteger(p.passMarks) || p.passMarks < 0 || p.passMarks > p.totalMarks) return fail(400, `${subjectName(p.subjectId)}: pass marks can't be more than the total`);
          const top = Math.max(0, ...db.examMarks.filter((m) => m.examId === examId && m.subjectId === p.subjectId && db.students.find((s) => s.id === m.studentId)?.classId === classId).map((m) => m.obtained ?? 0));
          if (top > p.totalMarks) return fail(409, `${subjectName(p.subjectId)}: a student already has ${top} marks, more than the new total`);
        }
        const kept = new Set(papers.map((p) => p.subjectId));
        const marked = db.examMarks.find((m) => m.examId === examId && !kept.has(m.subjectId) && db.students.find((s) => s.id === m.studentId)?.classId === classId);
        if (marked) return fail(409, `${subjectName(marked.subjectId)} already has marks, so it can't be taken off the date sheet`);
        const saved = papers.map((p): ExamPaper => {
          const existing = db.examPapers.find((x) => x.examId === examId && x.classId === classId && x.subjectId === p.subjectId);
          return { id: existing?.id ?? newId("pap"), examId, classId, ...p };
        });
        db.examPapers = [...db.examPapers.filter((x) => !(x.examId === examId && x.classId === classId)), ...saved];
        return { data: saved };
      },
      invalidatesTags: ["Exam"],
    }),
    /** Saves marks for one paper; entries not sent are left alone. */
    saveMarks: build.mutation<ExamMark[], { examId: string; subjectId: string; entries: { studentId: string; obtained: number | null; absent: boolean; remark?: string }[] }>({
      queryFn: ({ examId, subjectId, entries }) => {
        const exam = db.exams.find((e) => e.id === examId);
        if (!exam) return fail(404, "Exam not found");
        if (exam.publishedAt) return fail(409, "Results are published; marks are locked");
        const at = new Date().toISOString();
        const saved: ExamMark[] = [];
        for (const e of entries) {
          const student = db.students.find((s) => s.id === e.studentId);
          const paper = db.examPapers.find((p) => p.examId === examId && p.subjectId === subjectId && p.classId === student?.classId);
          if (!student || !paper) return fail(400, "This subject isn't on the date sheet for that class");
          if (e.obtained !== null && (e.obtained < 0 || e.obtained > paper.totalMarks || Math.round(e.obtained * 2) !== e.obtained * 2))
            return fail(400, `${student.name}: marks should be between 0 and ${paper.totalMarks}, in half marks`);
          const existing = db.examMarks.find((m) => m.examId === examId && m.subjectId === subjectId && m.studentId === e.studentId);
          const mark: ExamMark = {
            id: existing?.id ?? newId("mk"),
            examId,
            subjectId,
            studentId: e.studentId,
            obtained: e.absent ? null : e.obtained,
            absent: e.absent,
            remark: e.remark?.trim() || undefined,
            updatedAt: at,
            updatedBy: mockActor(),
          };
          db.examMarks = existing ? db.examMarks.map((m) => (m === existing ? mark : m)) : [...db.examMarks, mark];
          saved.push(mark);
        }
        return { data: saved };
      },
      invalidatesTags: ["Exam"],
    }),
    setResultsPublished: build.mutation<null, { examId: string; published: boolean }>({
      queryFn: ({ examId, published }) => {
        const exam = db.exams.find((e) => e.id === examId);
        if (!exam) return fail(404, "Exam not found");
        db.exams = db.exams.map((e) => (e.id === examId ? { ...e, publishedAt: published ? new Date().toISOString() : undefined } : e));
        return { data: null };
      },
      invalidatesTags: ["Exam"],
    }),

    // Messages ---------------------------------------------------------------
    sendMessages: build.mutation<MessageBatch, Omit<MessageBatch, "id" | "at" | "by" | "smsSegments" | "cost">>({
      queryFn: (input) => {
        if (input.recipients.length === 0) return fail(400, "Nobody in this audience has a mobile number");
        if (input.recipients.some((r) => !r.text.trim())) return fail(400, "Write the message first");
        if (input.recipients.some((r) => /\{\w+\}/.test(r.text))) return fail(400, "The message has a placeholder this audience can't fill; remove it");
        const batch: MessageBatch = {
          ...input,
          id: newId("msg"),
          at: new Date().toISOString(),
          by: mockActor(),
          smsSegments: input.recipients.filter((r) => r.channel === "sms").reduce((n, r) => n + smsSegments(r.text), 0),
          cost: input.recipients.reduce((n, r) => n + messageCost(r.channel, r.text), 0),
        };
        db.messages = [batch, ...db.messages];
        return { data: batch };
      },
      invalidatesTags: ["Message"],
    }),
    saveMessageTemplate: build.mutation<MessageTemplate, Pick<MessageTemplate, "name" | "body">>({
      queryFn: ({ name, body }) => {
        if (name.trim().length < 3) return fail(400, "Give the template a name");
        if (body.trim().length < 10) return fail(400, "Write the template text");
        if (db.messageTemplates.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) return fail(409, "A template with this name already exists");
        const template: MessageTemplate = { id: newId("tpl"), name: name.trim(), body: body.trim() };
        db.messageTemplates = [...db.messageTemplates, template];
        return { data: template };
      },
      invalidatesTags: ["Message"],
    }),
    deleteMessageTemplate: build.mutation<null, string>({
      queryFn: (id) => {
        const template = db.messageTemplates.find((t) => t.id === id);
        if (!template) return fail(404, "Template not found");
        if (template.builtIn) return fail(409, "Built-in templates can't be deleted");
        db.messageTemplates = db.messageTemplates.filter((t) => t.id !== id);
        return { data: null };
      },
      invalidatesTags: ["Message"],
    }),

    // Paper maker -------------------------------------------------------------
    savePaperDraft: build.mutation<Paper, PaperDraftInput>({
      queryFn: (input) => mockPaperService.saveDraft(paperCaller(input.teacherId), input),
      invalidatesTags: ["Paper"],
    }),
    submitPaper: build.mutation<Paper, { id: string; teacherId: string }>({
      queryFn: ({ id, teacherId }) => mockPaperService.submit(paperCaller(teacherId), id),
      invalidatesTags: ["Paper"],
    }),
    markPaperPrinted: build.mutation<Paper, string>({
      queryFn: (id) => mockPaperService.markPrinted(paperCaller(), id),
      invalidatesTags: ["Paper"],
    }),
    returnPaper: build.mutation<Paper, { id: string; note: string }>({
      queryFn: ({ id, note }) => mockPaperService.returnToTeacher(paperCaller(), id, note),
      invalidatesTags: ["Paper"],
    }),

    // Console: schools and the global question bank ----------------------------
    createTenant: build.mutation<Tenant, NewTenantInput>({ queryFn: (input) => mockTenantService.createTenant(platformCaller(), input), invalidatesTags: ["Tenant", "Branch"] }),
    setTenantModules: build.mutation<Tenant, { id: string; modules: ModuleKey[] }>({
      queryFn: ({ id, modules }) => mockTenantService.setModules(platformCaller(), id, modules),
      invalidatesTags: ["Tenant"],
    }),
    setTenantSeats: build.mutation<Tenant, { id: string; studentSeats: number }>({
      queryFn: ({ id, studentSeats }) => mockTenantService.setSeats(platformCaller(), id, studentSeats),
      invalidatesTags: ["Tenant"],
    }),
    setTenantStatus: build.mutation<Tenant, { id: string; status: TenantStatus; reason: string }>({
      queryFn: ({ id, status, reason }) => mockTenantService.setStatus(platformCaller(), id, status, reason),
      invalidatesTags: ["Tenant"],
    }),
    logViewAs: build.mutation<Tenant, string>({ queryFn: (id) => mockTenantService.logViewAs(platformCaller(), id), invalidatesTags: ["Tenant"] }),
    saveCatalogItem: build.mutation<PaperCatalog, CatalogItemInput>({ queryFn: (input) => mockPaperService.saveCatalogItem(paperCaller(), input), invalidatesTags: ["Paper"] }),
    deleteCatalogItem: build.mutation<PaperCatalog, { kind: CatalogKind; id: string }>({
      queryFn: ({ kind, id }) => mockPaperService.deleteCatalogItem(paperCaller(), kind, id),
      invalidatesTags: ["Paper"],
    }),
    saveBankQuestion: build.mutation<BankQuestion, Omit<BankQuestion, "id"> & { id?: string }>({
      queryFn: (input) => mockPaperService.saveBankQuestion(paperCaller(), input),
      invalidatesTags: ["Paper"],
    }),
    deleteBankQuestion: build.mutation<null, string>({ queryFn: (id) => mockPaperService.deleteBankQuestion(paperCaller(), id), invalidatesTags: ["Paper"] }),

    // Students ---------------------------------------------------------------
    admitStudent: build.mutation<Student, AdmissionInput>({
      queryFn: apiOr("admitStudent", (input: AdmissionInput) => {
        const seats = seatProblem(1);
        if (seats) return seats;
        const problem = checkPlacement(input.classId, input.sectionId, input.branchId);
        if (problem) return fail(400, problem);
        if (input.bForm && db.students.some((s) => s.bForm === input.bForm))
          return fail(409, `A student with B-form ${input.bForm} is already enrolled`);
        const student = createStudent(input);
        db.students = [...db.students, student];
        // Link siblings both ways.
        for (const id of student.siblingIds) {
          const sibling = db.students.find((s) => s.id === id);
          if (sibling && !sibling.siblingIds.includes(student.id)) putStudent({ ...sibling, siblingIds: [...sibling.siblingIds, student.id] });
        }
        logActivity(student.id, `Admitted to ${placement(student.classId, student.sectionId)}.`);
        return { data: student };
      }, (input) => ({ url: "/students", method: "POST", body: input })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    importStudents: build.mutation<Student[], AdmissionInput[]>({
      queryFn: apiOr("importStudents", (inputs: AdmissionInput[]) => {
        const seats = seatProblem(inputs.length);
        if (seats) return seats;
        const created = inputs.map((input, i) => createStudent(input, i));
        // Link siblings: students who share a guardian's mobile number, both ways.
        const linked = created.map((s) => {
          const phones = new Set(s.guardians.map((g) => g.phone));
          const siblings = [...db.students, ...created].filter((o) => o.id !== s.id && o.guardians.some((g) => phones.has(g.phone)));
          return { ...s, siblingIds: siblings.map((o) => o.id) };
        });
        db.students = [
          ...db.students.map((o) => {
            const newSiblings = linked.filter((s) => s.siblingIds.includes(o.id)).map((s) => s.id);
            return newSiblings.length ? { ...o, siblingIds: [...new Set([...o.siblingIds, ...newSiblings])] } : o;
          }),
          ...linked,
        ];
        for (const s of linked) logActivity(s.id, `Admitted to ${placement(s.classId, s.sectionId)} by spreadsheet import.`);
        return { data: linked };
      }, (inputs) => ({ url: "/students/import", method: "POST", body: inputs })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    updateStudent: build.mutation<Student, Pick<Student, "id"> & Partial<Omit<Student, "id" | "admissionNo">>>({
      queryFn: apiOr("updateStudent", ({ id, ...changes }: Pick<Student, "id"> & Partial<Omit<Student, "id" | "admissionNo">>) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (changes.bForm && db.students.some((s) => s.id !== id && s.bForm === changes.bForm))
          return fail(409, `B-form ${changes.bForm} belongs to another student`);
        const updated = putStudent({ ...student, ...changes, avatar: initialsOf(changes.name ?? student.name) });
        logActivity(id, "Details updated.");
        return { data: updated };
      }, ({ id, ...changes }) => ({ url: `/students/${id}`, method: "PATCH", body: changes })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    /** Moves one or more students to another section (and class) at the same campus. */
    changeSection: build.mutation<null, { ids: string[]; classId: string; sectionId: string }>({
      queryFn: apiOr("changeSection", ({ ids, classId, sectionId }: { ids: string[]; classId: string; sectionId: string }) => {
        const problem = checkPlacement(classId, sectionId);
        if (problem) return fail(400, problem);
        const where = placement(classId, sectionId);
        for (const id of ids) {
          const student = db.students.find((s) => s.id === id);
          if (!student || (student.classId === classId && student.sectionId === sectionId)) continue;
          const electives = student.classId === classId ? student.electiveSubjectIds : [];
          putStudent({ ...student, classId, sectionId, electiveSubjectIds: electives });
          logActivity(id, `Moved to ${where}.`);
        }
        return { data: null };
      }, (body) => ({ url: "/students/change-section", method: "POST", body })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    transferStudent: build.mutation<Student, { id: string; branchId: string; classId: string; sectionId: string }>({
      queryFn: apiOr("transferStudent", ({ id, branchId, classId, sectionId }: { id: string; branchId: string; classId: string; sectionId: string }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (branchId === student.branchId) return fail(400, "Choose a different campus");
        const problem = checkPlacement(classId, sectionId, branchId);
        if (problem) return fail(400, problem);
        const branch = db.branches.find((b) => b.id === branchId);
        const updated = putStudent({ ...student, branchId, classId, sectionId, electiveSubjectIds: [] });
        logActivity(id, `Transferred to ${branch?.name ?? "another campus"}, ${placement(classId, sectionId)}.`);
        return { data: updated };
      }, ({ id, ...body }) => ({ url: `/students/${id}/transfer`, method: "POST", body })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    setElectives: build.mutation<Student, { id: string; subjectIds: string[] }>({
      queryFn: apiOr("setElectives", ({ id, subjectIds }: { id: string; subjectIds: string[] }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const updated = putStudent({ ...student, electiveSubjectIds: subjectIds });
        const names = db.subjects.filter((s) => subjectIds.includes(s.id)).map((s) => s.name);
        logActivity(id, names.length ? `Electives set to ${names.join(", ")}.` : "Electives cleared.");
        return { data: updated };
      }, ({ id, subjectIds }) => ({ url: `/students/${id}/electives`, method: "PUT", body: { subjectIds } })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    withdrawStudent: build.mutation<Student, { id: string } & Withdrawal>({
      queryFn: apiOr("withdrawStudent", ({ id, ...withdrawal }: { id: string } & Withdrawal) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (student.enrollment === "withdrawn") return fail(409, "This student has already left");
        const updated = putStudent({ ...student, enrollment: "withdrawn", withdrawal });
        logActivity(id, `Marked as left${withdrawal.note ? `: ${withdrawal.note}` : "."}`);
        return { data: updated };
      }, ({ id, ...body }) => ({ url: `/students/${id}/withdraw`, method: "POST", body })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    readmitStudent: build.mutation<Student, { id: string; classId: string; sectionId: string; date: string }>({
      queryFn: apiOr("readmitStudent", ({ id, classId, sectionId, date }: { id: string; classId: string; sectionId: string; date: string }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (student.enrollment === "active") return fail(409, "This student is already enrolled");
        const problem = checkPlacement(classId, sectionId, student.branchId);
        if (problem) return fail(400, problem);
        const { withdrawal: _left, ...rest } = student;
        void _left;
        const updated = putStudent({ ...rest, enrollment: "active", classId, sectionId, electiveSubjectIds: [] });
        logActivity(id, `Re-admitted on ${date} to ${placement(classId, sectionId)}.`);
        return { data: updated };
      }, ({ id, ...body }) => ({ url: `/students/${id}/readmit`, method: "POST", body })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    updateGuardians: build.mutation<Student, { id: string; guardians: Guardian[] }>({
      queryFn: apiOr("updateGuardians", ({ id, guardians }: { id: string; guardians: Guardian[] }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (guardians.length === 0) return fail(400, "A student needs at least one guardian");
        if (guardians.filter((g) => g.primary).length !== 1) return fail(400, "Choose one main guardian");
        const updated = putStudent({ ...student, guardians });
        logActivity(id, "Guardians updated.");
        return { data: updated };
      }, ({ id, guardians }) => ({ url: `/students/${id}/guardians`, method: "PUT", body: { guardians } })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    addStudentDocument: build.mutation<Student, { id: string; document: Omit<StudentDocument, "id" | "uploadedAt"> }>({
      queryFn: apiOr("addStudentDocument", ({ id, document }: { id: string; document: Omit<StudentDocument, "id" | "uploadedAt"> }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const updated = putStudent({ ...student, documents: [...student.documents, { ...document, id: newId("doc"), uploadedAt: today() }] });
        logActivity(id, `Document added: ${document.name}.`);
        return { data: updated };
      }, ({ id, document }) => ({ url: `/students/${id}/documents`, method: "POST", body: document })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    removeStudentDocument: build.mutation<Student, { id: string; documentId: string }>({
      queryFn: apiOr("removeStudentDocument", ({ id, documentId }: { id: string; documentId: string }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const doc = student.documents.find((d) => d.id === documentId);
        const updated = putStudent({ ...student, documents: student.documents.filter((d) => d.id !== documentId) });
        if (doc) logActivity(id, `Document removed: ${doc.name}.`);
        return { data: updated };
      }, ({ id, documentId }) => ({ url: `/students/${id}/documents/${documentId}`, method: "DELETE" })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    /** Removes a student record entirely. Meant for records entered by mistake; use withdraw otherwise. */
    deleteStudent: build.mutation<null, string>({
      queryFn: apiOr("deleteStudent", (id: string) => {
        if (!db.students.some((s) => s.id === id)) return fail(404, "Student not found");
        db.students = db.students
          .filter((s) => s.id !== id)
          .map((s) => (s.siblingIds.includes(id) ? { ...s, siblingIds: s.siblingIds.filter((x) => x !== id) } : s));
        db.studentActivity = db.studentActivity.filter((a) => a.studentId !== id);
        return { data: null };
      }, (id) => ({ url: `/students/${id}`, method: "DELETE" })),
      invalidatesTags: ["Student", "StudentActivity"],
    }),

    // Sessions ---------------------------------------------------------------
    addSession: build.mutation<AcademicSession, Omit<AcademicSession, "id" | "current">>({
      queryFn: apiOr("addSession", (input: Omit<AcademicSession, "id" | "current">) => {
        if (db.sessions.some((s) => s.label === input.label)) return fail(409, `Session ${input.label} already exists`);
        if (input.endDate <= input.startDate) return fail(400, "The session must end after it starts");
        const session: AcademicSession = { ...input, id: input.label, current: false };
        db.sessions = [session, ...db.sessions].sort((a, b) => b.startDate.localeCompare(a.startDate));
        return { data: session };
      }, (input) => ({ url: "/sessions", method: "POST", body: input })),
      invalidatesTags: ["Session"],
    }),
    setCurrentSession: build.mutation<null, string>({
      queryFn: apiOr("setCurrentSession", (sessionId: string) => {
        if (!db.sessions.some((s) => s.id === sessionId)) return fail(404, "Session not found");
        db.sessions = db.sessions.map((s) => ({ ...s, current: s.id === sessionId }));
        return { data: null };
      }, (sessionId) => ({ url: "/sessions/current", method: "PUT", body: { sessionId } })),
      invalidatesTags: ["Session"],
    }),

    // Classes and sections ---------------------------------------------------
    addClass: build.mutation<SchoolClass, Omit<SchoolClass, "id">>({
      queryFn: apiOr("addClass", (input: Omit<SchoolClass, "id">) => {
        if (db.classes.some((c) => c.branchId === input.branchId && c.name.toLowerCase() === input.name.toLowerCase()))
          return fail(409, `${input.name} already exists at this campus`);
        const created: SchoolClass = { ...input, id: newId("cls") };
        db.classes = [...db.classes, created];
        return { data: created };
      }, (input) => ({ url: "/classes", method: "POST", body: input })),
      invalidatesTags: ["Class"],
    }),
    removeClass: build.mutation<null, string>({
      queryFn: apiOr("removeClass", (classId: string) => {
        if (db.sections.some((s) => s.classId === classId)) return fail(409, "Remove this class's sections first");
        db.classes = db.classes.filter((c) => c.id !== classId);
        db.classSubjects = db.classSubjects.filter((cs) => cs.classId !== classId);
        return { data: null };
      }, (classId) => ({ url: `/classes/${classId}`, method: "DELETE" })),
      invalidatesTags: ["Class", "ClassSubject"],
    }),
    addSection: build.mutation<Section, Omit<Section, "id">>({
      queryFn: apiOr("addSection", (input: Omit<Section, "id">) => {
        if (db.sections.some((s) => s.classId === input.classId && s.name.toLowerCase() === input.name.toLowerCase()))
          return fail(409, `Section ${input.name} already exists in this class`);
        const created: Section = { ...input, id: newId("sec") };
        db.sections = [...db.sections, created];
        return { data: created };
      }, (input) => ({ url: "/sections", method: "POST", body: input })),
      invalidatesTags: ["Section"],
    }),
    updateSection: build.mutation<Section, Pick<Section, "id"> & Partial<Omit<Section, "id" | "classId">>>({
      queryFn: apiOr("updateSection", ({ id, ...changes }: Pick<Section, "id"> & Partial<Omit<Section, "id" | "classId">>) => {
        const section = db.sections.find((s) => s.id === id);
        if (!section) return fail(404, "Section not found");
        const updated: Section = { ...section, ...changes };
        db.sections = db.sections.map((s) => (s.id === id ? updated : s));
        return { data: updated };
      }, ({ id, ...changes }) => ({ url: `/sections/${id}`, method: "PATCH", body: changes })),
      invalidatesTags: ["Section"],
    }),
    removeSection: build.mutation<null, string>({
      queryFn: apiOr("removeSection", (sectionId: string) => {
        db.sections = db.sections.filter((s) => s.id !== sectionId);
        return { data: null };
      }, (sectionId) => ({ url: `/sections/${sectionId}`, method: "DELETE" })),
      invalidatesTags: ["Section"],
    }),

    // Subjects ---------------------------------------------------------------
    addSubject: build.mutation<Subject, Omit<Subject, "id">>({
      queryFn: apiOr("addSubject", (input: Omit<Subject, "id">) => {
        if (db.subjects.some((s) => s.name.toLowerCase() === input.name.toLowerCase() || s.code === input.code))
          return fail(409, "A subject with this name or code already exists");
        const created: Subject = { ...input, id: newId("sub") };
        db.subjects = [...db.subjects, created];
        return { data: created };
      }, (input) => ({ url: "/subjects", method: "POST", body: input })),
      invalidatesTags: ["Subject"],
    }),
    removeSubject: build.mutation<null, string>({
      queryFn: apiOr("removeSubject", (subjectId: string) => {
        db.subjects = db.subjects.filter((s) => s.id !== subjectId);
        db.classSubjects = db.classSubjects.filter((cs) => cs.subjectId !== subjectId);
        return { data: null };
      }, (subjectId) => ({ url: `/subjects/${subjectId}`, method: "DELETE" })),
      invalidatesTags: ["Subject", "ClassSubject"],
    }),
    /** Offers a subject in a class (as core or elective), or stops offering it. */
    setClassSubject: build.mutation<null, { classId: string; subjectId: string; offered: boolean; elective: boolean }>({
      queryFn: apiOr("setClassSubject", ({ classId, subjectId, offered, elective }: { classId: string; subjectId: string; offered: boolean; elective: boolean }) => {
        const rest = db.classSubjects.filter((cs) => !(cs.classId === classId && cs.subjectId === subjectId));
        const entry: ClassSubject = { id: `${classId}-${subjectId}`, classId, subjectId, elective };
        db.classSubjects = offered ? [...rest, entry] : rest;
        return { data: null };
      }, (body) => ({ url: "/class-subjects", method: "PUT", body })),
      invalidatesTags: ["ClassSubject"],
    }),

    // Branches and users -----------------------------------------------------
    addBranch: build.mutation<Branch, Omit<Branch, "id">>({
      queryFn: apiOr("addBranch", (input: Omit<Branch, "id">) => {
        if (db.branches.some((b) => b.code.toLowerCase() === input.code.toLowerCase()))
          return fail(409, `Branch code ${input.code} is already in use`);
        const created: Branch = { ...input, id: newId("br") };
        db.branches = [...db.branches, created];
        return { data: created };
      }, (input) => ({ url: "/branches", method: "POST", body: input })),
      invalidatesTags: ["Branch"],
    }),
    inviteUser: build.mutation<User, Omit<User, "id" | "status" | "initials">>({
      queryFn: apiOr("inviteUser", (input: Omit<User, "id" | "status" | "initials">) => {
        if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
          return fail(409, `${input.email} already has an account`);
        const created: User = { ...input, id: newId("u"), initials: initialsOf(input.name), status: "invited" };
        db.users = [...db.users, created];
        return { data: created };
      }, (input) => ({ url: "/users", method: "POST", body: input })),
      invalidatesTags: ["User"],
    }),
    setUserStatus: build.mutation<null, { id: string; status: User["status"] }>({
      queryFn: apiOr("setUserStatus", ({ id, status }: { id: string; status: User["status"] }) => {
        const user = db.users.find((u) => u.id === id);
        if (!user) return fail(404, "User not found");
        if (user.role === "owner" && status === "disabled") return fail(400, "The owner's access can't be turned off");
        db.users = db.users.map((u) => (u.id === id ? { ...u, status } : u));
        return { data: null };
      }, ({ id, status }) => ({ url: `/users/${id}/status`, method: "PATCH", body: { status } })),
      invalidatesTags: ["User"],
    }),

    // Settings ---------------------------------------------------------------
    updateRolePermissions: build.mutation<RolePermissionsState, RolePermissionsState>({
      queryFn: apiOr("updateRolePermissions", (matrix: RolePermissionsState) => {
        db.rolePermissions = matrix;
        return { data: matrix };
      }, (matrix) => ({ url: "/settings/permissions", method: "PUT", body: matrix })),
      invalidatesTags: ["Permissions"],
    }),
    updateSchoolRules: build.mutation<SchoolRules, SchoolRules>({
      queryFn: apiOr("updateSchoolRules", (rules: SchoolRules) => {
        db.schoolRules = rules;
        return { data: rules };
      }, (rules) => ({ url: "/settings/rules", method: "PUT", body: rules })),
      invalidatesTags: ["Rules"],
    }),
    updateCampusProfile: build.mutation<CampusProfileData, CampusProfileData>({
      queryFn: apiOr("updateCampusProfile", (profile: CampusProfileData) => {
        db.campusProfile = profile;
        return { data: profile };
      }, (profile) => ({ url: "/settings/campus-profile", method: "PUT", body: profile })),
      invalidatesTags: ["Campus"],
    }),
  }),
});

/**
 * No-argument reads and the mock collection behind each. makeStore prefills
 * these into the cache so the first render already has data.
 */
export const prefilledReads = {
  getUsers: "users", getBranches: "branches", getSessions: "sessions", getStudents: "students",
  getStudentActivity: "studentActivity", getRegisters: "registers", getUnlockRequests: "unlockRequests", getStaffAttendance: "staffAttendance", getVouchers: "vouchers", getPayments: "payments", getFeeHeads: "feeHeads", getFeePlans: "feePlans",
  getConcessions: "concessions", getDayClosings: "dayClosings", getFeeReminders: "feeReminders",
  getStaff: "staff", getAllocations: "allocations", getTeachers: "teachers",
  getPayrollRuns: "payrollRuns", getPayslips: "payslips", getAdvances: "advances", getExams: "exams", getExamPapers: "examPapers", getExamMarks: "examMarks", getMessages: "messages", getMessageTemplates: "messageTemplates",
  getCampusProfile: "campusProfile", getRolePermissions: "rolePermissions", getSchoolRules: "schoolRules",
  getClasses: "classes", getSections: "sections", getSubjects: "subjects", getClassSubjects: "classSubjects",
  getPaperCatalog: "paperCatalog", getQuestionBank: "questionBank", getPapers: "papers",
  getTeacherDay: "teacherDay",
} as const satisfies Partial<Record<keyof typeof api.endpoints, keyof MockDb>>;

export const {
  useGetUsersQuery,
  useGetBranchesQuery,
  useGetSessionsQuery,
  useGetStudentsQuery,
  useGetStudentActivityQuery,
  useAdmitStudentMutation,
  useImportStudentsMutation,
  useUpdateStudentMutation,
  useChangeSectionMutation,
  useTransferStudentMutation,
  useSetElectivesMutation,
  useWithdrawStudentMutation,
  useReadmitStudentMutation,
  useUpdateGuardiansMutation,
  useAddStudentDocumentMutation,
  useRemoveStudentDocumentMutation,
  useDeleteStudentMutation,
  useGetRegistersQuery,
  useGetUnlockRequestsQuery,
  useGetStaffAttendanceQuery,
  useSubmitRegisterMutation,
  useLockRegistersMutation,
  useUnlockRegisterMutation,
  useRequestUnlockMutation,
  useDecideUnlockMutation,
  useMarkAlertsSentMutation,
  useSaveStaffAttendanceMutation,
  useGetVouchersQuery,
  useGetPaymentsQuery,
  useGetFeeHeadsQuery,
  useGetFeePlansQuery,
  useGetConcessionsQuery,
  useGetDayClosingsQuery,
  useGetFeeRemindersQuery,
  useGenerateVouchersMutation,
  useCancelVoucherMutation,
  useReversePaymentMutation,
  useSaveFeeHeadMutation,
  useRemoveFeeHeadMutation,
  useSaveFeePlanMutation,
  useSaveConcessionMutation,
  useRemoveConcessionMutation,
  useSendFeeRemindersMutation,
  useCloseDayMutation,
  useGetStaffQuery,
  useGetAllocationsQuery,
  useGetTeachersQuery,
  useGetPayrollRunsQuery,
  useGetPayslipsQuery,
  useGetAdvancesQuery,
  useSaveStaffMutation,
  useSetStaffStatusMutation,
  useSetAllocationMutation,
  useStartPayrollMutation,
  useUpdatePayslipMutation,
  useFinalisePayrollMutation,
  useMarkPayslipsPaidMutation,
  useAddAdvanceMutation,
  useGetExamsQuery,
  useGetExamPapersQuery,
  useGetExamMarksQuery,
  useGetMessagesQuery,
  useGetMessageTemplatesQuery,
  useSendMessagesMutation,
  useSaveMessageTemplateMutation,
  useDeleteMessageTemplateMutation,
  useSaveExamMutation,
  useDeleteExamMutation,
  useSaveDateSheetMutation,
  useSaveMarksMutation,
  useSetResultsPublishedMutation,
  useGetCampusProfileQuery,
  useGetRolePermissionsQuery,
  useGetSchoolRulesQuery,
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetSubjectsQuery,
  useGetClassSubjectsQuery,
  useGetPaperCatalogQuery,
  useGetQuestionBankQuery,
  useGetPapersQuery,
  useGetMyTenantQuery,
  useGetTenantsQuery,
  useCreateTenantMutation,
  useSetTenantModulesMutation,
  useSetTenantSeatsMutation,
  useSetTenantStatusMutation,
  useLogViewAsMutation,
  useSaveCatalogItemMutation,
  useDeleteCatalogItemMutation,
  useSaveBankQuestionMutation,
  useDeleteBankQuestionMutation,
  useGetPrintablePaperQuery,
  useSavePaperDraftMutation,
  useSubmitPaperMutation,
  useMarkPaperPrintedMutation,
  useReturnPaperMutation,
  useGetTeacherDayQuery,
  useRecordPaymentMutation,
  useAddSessionMutation,
  useSetCurrentSessionMutation,
  useAddClassMutation,
  useRemoveClassMutation,
  useAddSectionMutation,
  useUpdateSectionMutation,
  useRemoveSectionMutation,
  useAddSubjectMutation,
  useRemoveSubjectMutation,
  useSetClassSubjectMutation,
  useAddBranchMutation,
  useInviteUserMutation,
  useSetUserStatusMutation,
  useUpdateRolePermissionsMutation,
  useUpdateSchoolRulesMutation,
  useUpdateCampusProfileMutation,
} = api;

/** The message from a failed mutation, for showing next to the form. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Something went wrong. Try again.";
}
