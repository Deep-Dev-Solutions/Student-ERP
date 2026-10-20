"use client";

import { holidayOn, useToday } from "@/features/attendance/hooks";
import { useTeachingSections } from "@/features/teacher-portal/hooks";
import { useBranchClasses, useSelectedSession } from "@/hooks/use-academics";
import { useCan, useCurrentBranch, useModules, usePermissionFlags } from "@/hooks/use-session";
import { usePortalTeacher } from "@/features/teacher-portal/hooks";
import { voucherState } from "@/lib/fees";
import { sitsPaper } from "@/lib/results";
import {
  useGetAllocationsQuery,
  useGetClassSubjectsQuery,
  useGetExamMarksQuery,
  useGetExamPapersQuery,
  useGetExamsQuery,
  useGetPapersQuery,
  useGetPayrollRunsQuery,
  useGetRegistersQuery,
  useGetSchoolRulesQuery,
  useGetSectionsQuery,
  useGetStudentsQuery,
  useGetUnlockRequestsQuery,
  useGetVouchersQuery,
} from "@/store/api";

export interface Notice {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  href: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Unmarked students in papers whose date has passed, for the given (section, subject) pairs or the whole campus. */
function usePendingMarks(scope?: { sectionId: string; classId: string; subjectId: string }[]) {
  const today = useToday();
  const branch = useCurrentBranch();
  const { session } = useSelectedSession();
  const { data: exams = [] } = useGetExamsQuery();
  const { data: papers = [] } = useGetExamPapersQuery();
  const { data: marks = [] } = useGetExamMarksQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  if (!today) return 0;
  const open = exams.filter((e) => e.branchId === branch?.id && e.sessionId === session?.id && !e.publishedAt);
  let pending = 0;
  for (const paper of papers.filter((p) => open.some((e) => e.id === p.examId) && p.date < today)) {
    const sitting = students.filter(
      (s) =>
        s.enrollment === "active" &&
        s.branchId === branch?.id &&
        sitsPaper(s, paper, classSubjects) &&
        (!scope || scope.some((x) => x.sectionId === s.sectionId && x.subjectId === paper.subjectId))
    );
    pending += sitting.filter((s) => !marks.some((m) => m.examId === paper.examId && m.subjectId === paper.subjectId && m.studentId === s.id)).length;
  }
  return pending;
}

/** What needs attention at this campus, for the admin console. */
export function useAdminNotices(): Notice[] {
  const today = useToday();
  const branch = useCurrentBranch();
  const { session } = useSelectedSession();
  const classes = useBranchClasses();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: requests = [] } = useGetUnlockRequestsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: runs = [] } = useGetPayrollRunsQuery();
  const { data: exams = [] } = useGetExamsQuery();
  const { data: papers = [] } = useGetExamPapersQuery();
  const { data: marks = [] } = useGetExamMarksQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const { data: allocations = [] } = useGetAllocationsQuery();
  const canLock = useCan("att_lock_roster");
  const canAlert = useCan("att_send_alerts");
  const canSeeFees = useCan("fin_view_defaulters");
  const canPayroll = useCan("fin_manage_payroll");
  const canExams = useCan("acad_create_exam");
  const canMarks = useCan("acad_enter_marks");
  const canAllocate = useCan("acad_manage_allocations");
  const { canPrintPapers } = usePermissionFlags();
  const { has } = useModules();
  const { data: printPapers = [] } = useGetPapersQuery();
  const pendingMarks = usePendingMarks();
  if (!today || !branch) return [];

  const notices: Notice[] = [];
  const branchRegisters = registers.filter((r) => r.branchId === branch.id);
  const pendingRequests = requests.filter((r) => r.status === "pending" && branchRegisters.some((x) => x.id === r.registerId));
  if (canLock && pendingRequests.length)
    notices.push({ id: "unlock", tone: "warning", title: `${plural(pendingRequests.length, "request", "requests")} to reopen a register`, href: "/attendance?tab=review" });

  if (has("attendance") && !holidayOn(today, rules) && rules?.attendance.mode !== "subject_wise") {
    const occupied = sections.filter((s) => classes.some((c) => c.id === s.classId) && students.some((st) => st.sectionId === s.id && st.enrollment === "active"));
    const missing = occupied.filter((s) => !branchRegisters.some((r) => r.sectionId === s.id && r.date === today && !r.subjectId));
    if (missing.length) notices.push({ id: "registers", tone: "info", title: `${plural(missing.length, "section hasn't", "sections haven't")} submitted today's register`, href: "/attendance" });
  }

  const unsent = branchRegisters.filter((r) => r.date === today && !r.alertsSentAt && Object.values(r.marks).some((m) => m.status === "absent"));
  if (canAlert && unsent.length) notices.push({ id: "alerts", tone: "warning", title: `Absence alerts not sent for ${plural(unsent.length, "register", "registers")} today`, href: "/attendance?tab=alerts" });

  const overdueFamilies = new Set(vouchers.filter((v) => v.branchId === branch.id && voucherState(v, today) === "overdue").map((v) => v.studentId)).size;
  if (canSeeFees && overdueFamilies) notices.push({ id: "overdue", tone: "danger", title: `${plural(overdueFamilies, "student has", "students have")} overdue fees`, href: "/fees?tab=defaulters" });

  const month = today.slice(0, 7);
  const run = runs.find((r) => r.branchId === branch.id && r.month === month);
  if (canPayroll && run?.status === "draft") notices.push({ id: "payroll", tone: "info", title: "This month's payroll is waiting to be finalised", href: "/staff?tab=payroll" });
  else if (canPayroll && !run && Number(today.slice(8, 10)) >= 25) notices.push({ id: "payroll", tone: "info", title: "This month's payroll hasn't been started", href: "/staff?tab=payroll" });

  const open = exams.filter((e) => e.branchId === branch.id && e.sessionId === session?.id && !e.publishedAt);
  const ready = open.filter((e) => {
    if (e.endDate >= today) return false;
    const list = papers.filter((p) => p.examId === e.id);
    return list.length > 0 && list.every((p) => students.filter((s) => s.enrollment === "active" && sitsPaper(s, p, classSubjects)).every((s) => marks.some((m) => m.examId === e.id && m.subjectId === p.subjectId && m.studentId === s.id)));
  });
  if (canExams && ready.length) notices.push({ id: "publish", tone: "info", title: `${ready[0].title} is fully marked and ready to publish`, href: "/exams?tab=results" });
  if (canMarks && pendingMarks) notices.push({ id: "marks", tone: "warning", title: `${plural(pendingMarks, "mark is", "marks are")} still missing for papers already sat`, href: "/exams?tab=marks" });

  if (canAllocate && has("students")) {
    const busy = classes.filter((c) => allocations.some((a) => a.classId === c.id));
    const gaps = busy.reduce((n, c) => {
      const subs = classSubjects.filter((cs) => cs.classId === c.id);
      const secs = sections.filter((s) => s.classId === c.id);
      return n + subs.reduce((m, cs) => m + secs.filter((s) => !allocations.some((a) => a.sectionId === s.id && a.subjectId === cs.subjectId)).length, 0);
    }, 0);
    if (gaps) notices.push({ id: "allocations", tone: "info", title: `${plural(gaps, "subject has", "subjects have")} no teacher assigned`, href: "/staff?tab=allocations" });
  }

  const waiting = printPapers.filter((p) => p.branchId === branch.id && p.status === "submitted").length;
  if (canPrintPapers && waiting) notices.push({ id: "papers", tone: "info", title: `${plural(waiting, "exam paper is", "exam papers are")} waiting to be printed`, href: "/papers" });
  return notices;
}

/** What needs the portal teacher's attention. */
export function useTeacherNotices(): Notice[] {
  const today = useToday();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const teaching = useTeachingSections();
  const { has } = useModules();
  const { staffId } = usePortalTeacher();
  const { data: printPapers = [] } = useGetPapersQuery();
  const pendingMarks = usePendingMarks(teaching.flatMap((t) => t.subjects.map((s) => ({ sectionId: t.section.id, classId: t.cls.id, subjectId: s.id }))));
  if (!today) return [];
  const notices: Notice[] = [];
  if (has("attendance") && !holidayOn(today, rules) && rules?.attendance.mode === "class_incharge") {
    const missing = teaching.filter((t) => t.incharge && !registers.some((r) => r.sectionId === t.section.id && r.date === today && !r.subjectId));
    for (const t of missing) notices.push({ id: `reg-${t.section.id}`, tone: "warning", title: `Today's register for ${t.label} isn't submitted`, href: "/teacher-portal/attendance" });
  }
  if (has("exams") && pendingMarks) notices.push({ id: "marks", tone: "info", title: `${plural(pendingMarks, "mark is", "marks are")} still missing in your subjects`, href: "/teacher-portal/marks" });
  const returned = printPapers.filter((p) => p.teacherId === staffId && p.status === "returned").length;
  if (has("paper_maker") && returned) notices.push({ id: "returned", tone: "warning", title: `${plural(returned, "paper was", "papers were")} returned to you with a note`, href: "/teacher-portal/paper-maker" });
  return notices;
}
