import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { db, mockActor, type MockDb } from "@/mocks/db";
import type {
  AcademicSession,
  Branch,
  CampusProfileData,
  ClassSubject,
  FeeVoucher,
  PaymentInput,
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

/*
 * One API slice for the whole app. Every endpoint reads and writes the
 * in-memory mock database for now; when the NestJS API exists, swap
 * `fakeBaseQuery` for `fetchBaseQuery({ baseUrl })` and each `queryFn` for a
 * `query`. Mutations return `{ error }` the way the real API will.
 */

type Tag =
  | "Voucher" | "Defaulter" | "Session" | "Branch" | "User" | "Class" | "Section"
  | "Subject" | "ClassSubject" | "Permissions" | "Rules" | "Campus" | "Student" | "StudentActivity" | "Register" | "UnlockRequest" | "StaffAttendance";

/** A read endpoint that returns one collection from the mock database. */
const read = <K extends keyof MockDb>(key: K, tag?: Tag) => ({
  queryFn: () => ({ data: db[key] }),
  ...(tag ? { providesTags: [tag] } : {}),
});

const fail = (status: number, message: string) => ({ error: { status, message } });

/** A short unique id for records created in the browser. */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;


const today = () => new Date().toISOString().slice(0, 10);

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

/** Replaces one student record. */
const putStudent = (student: Student) => {
  db.students = db.students.map((s) => (s.id === student.id ? student : s));
  return student;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ status: number; message: string }>(),
  tagTypes: ["Voucher", "Defaulter", "Session", "Branch", "User", "Class", "Section", "Subject", "ClassSubject", "Permissions", "Rules", "Campus", "Student", "StudentActivity", "Register", "UnlockRequest", "StaffAttendance"],
  // Demo data never goes stale; keep it for the whole visit.
  keepUnusedDataFor: 60 * 60 * 24,
  endpoints: (build) => ({
    getUsers: build.query<MockDb["users"], void>(read("users", "User")),
    getBranches: build.query<MockDb["branches"], void>(read("branches", "Branch")),
    getSessions: build.query<MockDb["sessions"], void>(read("sessions", "Session")),
    getStudents: build.query<MockDb["students"], void>(read("students", "Student")),
    getStudentActivity: build.query<MockDb["studentActivity"], void>(read("studentActivity", "StudentActivity")),
    getRegisters: build.query<MockDb["registers"], void>(read("registers", "Register")),
    getUnlockRequests: build.query<MockDb["unlockRequests"], void>(read("unlockRequests", "UnlockRequest")),
    getStaffAttendance: build.query<MockDb["staffAttendance"], void>(read("staffAttendance", "StaffAttendance")),
    getVouchers: build.query<MockDb["vouchers"], void>(read("vouchers", "Voucher")),
    getDefaulters: build.query<MockDb["defaulters"], void>(read("defaulters", "Defaulter")),
    getStaff: build.query<MockDb["staff"], void>(read("staff")),
    getAllocations: build.query<MockDb["allocations"], void>(read("allocations")),
    getTeachers: build.query<MockDb["teachers"], void>(read("teachers")),
    getPayroll: build.query<MockDb["payroll"], void>(read("payroll")),
    getExams: build.query<MockDb["exams"], void>(read("exams")),
    getMarks: build.query<MockDb["marks"], void>(read("marks")),
    getTeacherMarks: build.query<MockDb["teacherMarks"], void>(read("teacherMarks")),
    getCampusProfile: build.query<MockDb["campusProfile"], void>(read("campusProfile", "Campus")),
    getRolePermissions: build.query<MockDb["rolePermissions"], void>(read("rolePermissions", "Permissions")),
    getSchoolRules: build.query<MockDb["schoolRules"], void>(read("schoolRules", "Rules")),
    getClasses: build.query<MockDb["classes"], void>(read("classes", "Class")),
    getSections: build.query<MockDb["sections"], void>(read("sections", "Section")),
    getSubjects: build.query<MockDb["subjects"], void>(read("subjects", "Subject")),
    getClassSubjects: build.query<MockDb["classSubjects"], void>(read("classSubjects", "ClassSubject")),
    getChapters: build.query<MockDb["chapters"], void>(read("chapters")),
    getPaperQuestions: build.query<MockDb["paperQuestions"], void>(read("paperQuestions")),
    getAlternativeQuestions: build.query<MockDb["alternativeQuestions"], void>(read("alternativeQuestions")),
    getTeacherDay: build.query<MockDb["teacherDay"], void>(read("teacherDay")),

    /** Records a full payment against a voucher and marks it paid. */
    recordPayment: build.mutation<FeeVoucher, PaymentInput>({
      queryFn: ({ voucherId }) => {
        const voucher = db.vouchers.find((v) => v.id === voucherId);
        if (!voucher) return fail(404, "Voucher not found");
        if (voucher.status === "paid") return fail(409, "This voucher is already paid");
        const paid: FeeVoucher = { ...voucher, status: "paid" };
        db.vouchers = db.vouchers.map((v) => (v.id === voucherId ? paid : v));
        return { data: paid };
      },
      invalidatesTags: ["Voucher"],
    }),

    // Attendance -------------------------------------------------------------
    /** Saves a register. Resubmitting a reopened register records each change and locks it again. */
    submitRegister: build.mutation<
      AttendanceRegister,
      Pick<AttendanceRegister, "branchId" | "classId" | "sectionId" | "date" | "subjectId" | "marks">
    >({
      queryFn: (input) => {
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
      },
      invalidatesTags: ["Register"],
    }),
    lockRegisters: build.mutation<null, string[]>({
      queryFn: (ids) => {
        const now = new Date().toISOString();
        db.registers = db.registers.map((r) =>
          ids.includes(r.id) && !r.lockedAt ? { ...r, lockedAt: now, lockedBy: mockActor(), reopened: undefined } : r
        );
        return { data: null };
      },
      invalidatesTags: ["Register"],
    }),
    /** Reopens a locked register so it can be corrected. Only branch admins; a reason is required. */
    unlockRegister: build.mutation<null, { id: string; reason: string }>({
      queryFn: ({ id, reason }) => {
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
      },
      invalidatesTags: ["Register", "UnlockRequest"],
    }),
    requestUnlock: build.mutation<UnlockRequest, { registerId: string; reason: string }>({
      queryFn: ({ registerId, reason }) => {
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
      },
      invalidatesTags: ["UnlockRequest"],
    }),
    decideUnlock: build.mutation<null, { id: string; approve: boolean }>({
      queryFn: ({ id, approve }) => {
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
      },
      invalidatesTags: ["Register", "UnlockRequest"],
    }),
    markAlertsSent: build.mutation<null, string[]>({
      queryFn: (ids) => {
        const now = new Date().toISOString();
        db.registers = db.registers.map((r) => (ids.includes(r.id) ? { ...r, alertsSentAt: now } : r));
        return { data: null };
      },
      invalidatesTags: ["Register"],
    }),
    saveStaffAttendance: build.mutation<StaffAttendanceDay, Pick<StaffAttendanceDay, "branchId" | "date" | "marks">>({
      queryFn: (input) => {
        const day: StaffAttendanceDay = { ...input, id: `${input.branchId}:${input.date}`, savedAt: new Date().toISOString(), savedBy: mockActor() };
        db.staffAttendance = [...db.staffAttendance.filter((d) => d.id !== day.id), day];
        return { data: day };
      },
      invalidatesTags: ["StaffAttendance"],
    }),

    // Students ---------------------------------------------------------------
    admitStudent: build.mutation<Student, AdmissionInput>({
      queryFn: (input) => {
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
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    importStudents: build.mutation<Student[], AdmissionInput[]>({
      queryFn: (inputs) => {
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
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    updateStudent: build.mutation<Student, Pick<Student, "id"> & Partial<Omit<Student, "id" | "admissionNo">>>({
      queryFn: ({ id, ...changes }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (changes.bForm && db.students.some((s) => s.id !== id && s.bForm === changes.bForm))
          return fail(409, `B-form ${changes.bForm} belongs to another student`);
        const updated = putStudent({ ...student, ...changes, avatar: initialsOf(changes.name ?? student.name) });
        logActivity(id, "Details updated.");
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    /** Moves one or more students to another section (and class) at the same campus. */
    changeSection: build.mutation<null, { ids: string[]; classId: string; sectionId: string }>({
      queryFn: ({ ids, classId, sectionId }) => {
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
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    transferStudent: build.mutation<Student, { id: string; branchId: string; classId: string; sectionId: string }>({
      queryFn: ({ id, branchId, classId, sectionId }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (branchId === student.branchId) return fail(400, "Choose a different campus");
        const problem = checkPlacement(classId, sectionId, branchId);
        if (problem) return fail(400, problem);
        const branch = db.branches.find((b) => b.id === branchId);
        const updated = putStudent({ ...student, branchId, classId, sectionId, electiveSubjectIds: [] });
        logActivity(id, `Transferred to ${branch?.name ?? "another campus"}, ${placement(classId, sectionId)}.`);
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    setElectives: build.mutation<Student, { id: string; subjectIds: string[] }>({
      queryFn: ({ id, subjectIds }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const updated = putStudent({ ...student, electiveSubjectIds: subjectIds });
        const names = db.subjects.filter((s) => subjectIds.includes(s.id)).map((s) => s.name);
        logActivity(id, names.length ? `Electives set to ${names.join(", ")}.` : "Electives cleared.");
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    withdrawStudent: build.mutation<Student, { id: string } & Withdrawal>({
      queryFn: ({ id, ...withdrawal }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (student.enrollment === "withdrawn") return fail(409, "This student has already left");
        const updated = putStudent({ ...student, enrollment: "withdrawn", withdrawal });
        logActivity(id, `Marked as left${withdrawal.note ? `: ${withdrawal.note}` : "."}`);
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    readmitStudent: build.mutation<Student, { id: string; classId: string; sectionId: string; date: string }>({
      queryFn: ({ id, classId, sectionId, date }) => {
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
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    updateGuardians: build.mutation<Student, { id: string; guardians: Guardian[] }>({
      queryFn: ({ id, guardians }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        if (guardians.length === 0) return fail(400, "A student needs at least one guardian");
        if (guardians.filter((g) => g.primary).length !== 1) return fail(400, "Choose one main guardian");
        const updated = putStudent({ ...student, guardians });
        logActivity(id, "Guardians updated.");
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    addStudentDocument: build.mutation<Student, { id: string; document: Omit<StudentDocument, "id" | "uploadedAt"> }>({
      queryFn: ({ id, document }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const updated = putStudent({ ...student, documents: [...student.documents, { ...document, id: newId("doc"), uploadedAt: today() }] });
        logActivity(id, `Document added: ${document.name}.`);
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    removeStudentDocument: build.mutation<Student, { id: string; documentId: string }>({
      queryFn: ({ id, documentId }) => {
        const student = db.students.find((s) => s.id === id);
        if (!student) return fail(404, "Student not found");
        const doc = student.documents.find((d) => d.id === documentId);
        const updated = putStudent({ ...student, documents: student.documents.filter((d) => d.id !== documentId) });
        if (doc) logActivity(id, `Document removed: ${doc.name}.`);
        return { data: updated };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),
    /** Removes a student record entirely. Meant for records entered by mistake; use withdraw otherwise. */
    deleteStudent: build.mutation<null, string>({
      queryFn: (id) => {
        if (!db.students.some((s) => s.id === id)) return fail(404, "Student not found");
        db.students = db.students
          .filter((s) => s.id !== id)
          .map((s) => (s.siblingIds.includes(id) ? { ...s, siblingIds: s.siblingIds.filter((x) => x !== id) } : s));
        db.studentActivity = db.studentActivity.filter((a) => a.studentId !== id);
        return { data: null };
      },
      invalidatesTags: ["Student", "StudentActivity"],
    }),

    // Sessions ---------------------------------------------------------------
    addSession: build.mutation<AcademicSession, Omit<AcademicSession, "id" | "current">>({
      queryFn: (input) => {
        if (db.sessions.some((s) => s.label === input.label)) return fail(409, `Session ${input.label} already exists`);
        if (input.endDate <= input.startDate) return fail(400, "The session must end after it starts");
        const session: AcademicSession = { ...input, id: input.label, current: false };
        db.sessions = [session, ...db.sessions].sort((a, b) => b.startDate.localeCompare(a.startDate));
        return { data: session };
      },
      invalidatesTags: ["Session"],
    }),
    setCurrentSession: build.mutation<null, string>({
      queryFn: (sessionId) => {
        if (!db.sessions.some((s) => s.id === sessionId)) return fail(404, "Session not found");
        db.sessions = db.sessions.map((s) => ({ ...s, current: s.id === sessionId }));
        return { data: null };
      },
      invalidatesTags: ["Session"],
    }),

    // Classes and sections ---------------------------------------------------
    addClass: build.mutation<SchoolClass, Omit<SchoolClass, "id">>({
      queryFn: (input) => {
        if (db.classes.some((c) => c.branchId === input.branchId && c.name.toLowerCase() === input.name.toLowerCase()))
          return fail(409, `${input.name} already exists at this campus`);
        const created: SchoolClass = { ...input, id: newId("cls") };
        db.classes = [...db.classes, created];
        return { data: created };
      },
      invalidatesTags: ["Class"],
    }),
    removeClass: build.mutation<null, string>({
      queryFn: (classId) => {
        if (db.sections.some((s) => s.classId === classId)) return fail(409, "Remove this class's sections first");
        db.classes = db.classes.filter((c) => c.id !== classId);
        db.classSubjects = db.classSubjects.filter((cs) => cs.classId !== classId);
        return { data: null };
      },
      invalidatesTags: ["Class", "ClassSubject"],
    }),
    addSection: build.mutation<Section, Omit<Section, "id">>({
      queryFn: (input) => {
        if (db.sections.some((s) => s.classId === input.classId && s.name.toLowerCase() === input.name.toLowerCase()))
          return fail(409, `Section ${input.name} already exists in this class`);
        const created: Section = { ...input, id: newId("sec") };
        db.sections = [...db.sections, created];
        return { data: created };
      },
      invalidatesTags: ["Section"],
    }),
    updateSection: build.mutation<Section, Pick<Section, "id"> & Partial<Omit<Section, "id" | "classId">>>({
      queryFn: ({ id, ...changes }) => {
        const section = db.sections.find((s) => s.id === id);
        if (!section) return fail(404, "Section not found");
        const updated: Section = { ...section, ...changes };
        db.sections = db.sections.map((s) => (s.id === id ? updated : s));
        return { data: updated };
      },
      invalidatesTags: ["Section"],
    }),
    removeSection: build.mutation<null, string>({
      queryFn: (sectionId) => {
        db.sections = db.sections.filter((s) => s.id !== sectionId);
        return { data: null };
      },
      invalidatesTags: ["Section"],
    }),

    // Subjects ---------------------------------------------------------------
    addSubject: build.mutation<Subject, Omit<Subject, "id">>({
      queryFn: (input) => {
        if (db.subjects.some((s) => s.name.toLowerCase() === input.name.toLowerCase() || s.code === input.code))
          return fail(409, "A subject with this name or code already exists");
        const created: Subject = { ...input, id: newId("sub") };
        db.subjects = [...db.subjects, created];
        return { data: created };
      },
      invalidatesTags: ["Subject"],
    }),
    removeSubject: build.mutation<null, string>({
      queryFn: (subjectId) => {
        db.subjects = db.subjects.filter((s) => s.id !== subjectId);
        db.classSubjects = db.classSubjects.filter((cs) => cs.subjectId !== subjectId);
        return { data: null };
      },
      invalidatesTags: ["Subject", "ClassSubject"],
    }),
    /** Offers a subject in a class (as core or elective), or stops offering it. */
    setClassSubject: build.mutation<null, { classId: string; subjectId: string; offered: boolean; elective: boolean }>({
      queryFn: ({ classId, subjectId, offered, elective }) => {
        const rest = db.classSubjects.filter((cs) => !(cs.classId === classId && cs.subjectId === subjectId));
        const entry: ClassSubject = { id: `${classId}-${subjectId}`, classId, subjectId, elective };
        db.classSubjects = offered ? [...rest, entry] : rest;
        return { data: null };
      },
      invalidatesTags: ["ClassSubject"],
    }),

    // Branches and users -----------------------------------------------------
    addBranch: build.mutation<Branch, Omit<Branch, "id">>({
      queryFn: (input) => {
        if (db.branches.some((b) => b.code.toLowerCase() === input.code.toLowerCase()))
          return fail(409, `Branch code ${input.code} is already in use`);
        const created: Branch = { ...input, id: newId("br") };
        db.branches = [...db.branches, created];
        return { data: created };
      },
      invalidatesTags: ["Branch"],
    }),
    inviteUser: build.mutation<User, Omit<User, "id" | "status" | "initials">>({
      queryFn: (input) => {
        if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
          return fail(409, `${input.email} already has an account`);
        const created: User = { ...input, id: newId("u"), initials: initialsOf(input.name), status: "invited" };
        db.users = [...db.users, created];
        return { data: created };
      },
      invalidatesTags: ["User"],
    }),
    setUserStatus: build.mutation<null, { id: string; status: User["status"] }>({
      queryFn: ({ id, status }) => {
        const user = db.users.find((u) => u.id === id);
        if (!user) return fail(404, "User not found");
        if (user.role === "owner" && status === "disabled") return fail(400, "The owner's access can't be turned off");
        db.users = db.users.map((u) => (u.id === id ? { ...u, status } : u));
        return { data: null };
      },
      invalidatesTags: ["User"],
    }),

    // Settings ---------------------------------------------------------------
    updateRolePermissions: build.mutation<RolePermissionsState, RolePermissionsState>({
      queryFn: (matrix) => {
        db.rolePermissions = matrix;
        return { data: matrix };
      },
      invalidatesTags: ["Permissions"],
    }),
    updateSchoolRules: build.mutation<SchoolRules, SchoolRules>({
      queryFn: (rules) => {
        db.schoolRules = rules;
        return { data: rules };
      },
      invalidatesTags: ["Rules"],
    }),
    updateCampusProfile: build.mutation<CampusProfileData, CampusProfileData>({
      queryFn: (profile) => {
        db.campusProfile = profile;
        return { data: profile };
      },
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
  getStudentActivity: "studentActivity", getRegisters: "registers", getUnlockRequests: "unlockRequests", getStaffAttendance: "staffAttendance", getVouchers: "vouchers", getDefaulters: "defaulters",
  getStaff: "staff", getAllocations: "allocations", getTeachers: "teachers",
  getPayroll: "payroll", getExams: "exams", getMarks: "marks", getTeacherMarks: "teacherMarks",
  getCampusProfile: "campusProfile", getRolePermissions: "rolePermissions", getSchoolRules: "schoolRules",
  getClasses: "classes", getSections: "sections", getSubjects: "subjects", getClassSubjects: "classSubjects",
  getChapters: "chapters", getPaperQuestions: "paperQuestions", getAlternativeQuestions: "alternativeQuestions",
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
  useGetDefaultersQuery,
  useGetStaffQuery,
  useGetAllocationsQuery,
  useGetTeachersQuery,
  useGetPayrollQuery,
  useGetExamsQuery,
  useGetMarksQuery,
  useGetTeacherMarksQuery,
  useGetCampusProfileQuery,
  useGetRolePermissionsQuery,
  useGetSchoolRulesQuery,
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetSubjectsQuery,
  useGetClassSubjectsQuery,
  useGetChaptersQuery,
  useGetPaperQuestionsQuery,
  useGetAlternativeQuestionsQuery,
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
