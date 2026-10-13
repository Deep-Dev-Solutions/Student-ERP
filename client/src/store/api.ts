import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { db, type MockDb } from "@/mocks/db";
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
  Subject,
  User,
} from "@/types";

/*
 * One API slice for the whole app. Every endpoint reads and writes the
 * in-memory mock database for now; when the NestJS API exists, swap
 * `fakeBaseQuery` for `fetchBaseQuery({ baseUrl })` and each `queryFn` for a
 * `query`. Mutations return `{ error }` the way the real API will.
 */

type Tag =
  | "Voucher" | "Defaulter" | "Session" | "Branch" | "User" | "Class" | "Section"
  | "Subject" | "ClassSubject" | "Permissions" | "Rules" | "Campus";

/** A read endpoint that returns one collection from the mock database. */
const read = <K extends keyof MockDb>(key: K, tag?: Tag) => ({
  queryFn: () => ({ data: db[key] }),
  ...(tag ? { providesTags: [tag] } : {}),
});

const fail = (status: number, message: string) => ({ error: { status, message } });

/** A short unique id for records created in the browser. */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ status: number; message: string }>(),
  tagTypes: ["Voucher", "Defaulter", "Session", "Branch", "User", "Class", "Section", "Subject", "ClassSubject", "Permissions", "Rules", "Campus"],
  // Demo data never goes stale; keep it for the whole visit.
  keepUnusedDataFor: 60 * 60 * 24,
  endpoints: (build) => ({
    getUsers: build.query<MockDb["users"], void>(read("users", "User")),
    getBranches: build.query<MockDb["branches"], void>(read("branches", "Branch")),
    getSessions: build.query<MockDb["sessions"], void>(read("sessions", "Session")),
    getStudents: build.query<MockDb["students"], void>(read("students")),
    getAttendanceRoster: build.query<MockDb["attendanceRoster"], void>(read("attendanceRoster")),
    getClassLocks: build.query<MockDb["classLocks"], void>(read("classLocks")),
    getAbsentees: build.query<MockDb["absentees"], void>(read("absentees")),
    getTeacherRoster: build.query<MockDb["teacherRoster"], void>(read("teacherRoster")),
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
        const initials = input.name
          .replace(/^(Dr|Mr|Mrs|Ms|Sir)\.?\s+/i, "")
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const created: User = { ...input, id: newId("u"), initials, status: "invited" };
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
  getAttendanceRoster: "attendanceRoster", getClassLocks: "classLocks", getAbsentees: "absentees",
  getTeacherRoster: "teacherRoster", getVouchers: "vouchers", getDefaulters: "defaulters",
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
  useGetAttendanceRosterQuery,
  useGetClassLocksQuery,
  useGetAbsenteesQuery,
  useGetTeacherRosterQuery,
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
