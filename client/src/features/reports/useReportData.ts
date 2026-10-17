"use client";

import { useToday } from "@/features/attendance/hooks";
import { useBranchClasses, useGrader, useSelectedSession } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import {
  useGetBranchesQuery,
  useGetClassSubjectsQuery,
  useGetExamMarksQuery,
  useGetExamPapersQuery,
  useGetExamsQuery,
  useGetPaymentsQuery,
  useGetPayrollRunsQuery,
  useGetPayslipsQuery,
  useGetRegistersQuery,
  useGetSectionsQuery,
  useGetStaffAttendanceQuery,
  useGetStaffQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
  useGetVouchersQuery,
} from "@/store/api";
import type { ReportData } from "./definitions";

/** Everything the reports read, for the selected campus and session. */
export function useReportData(): ReportData | null {
  const today = useToday();
  const branch = useCurrentBranch();
  const { session } = useSelectedSession();
  const classes = useBranchClasses();
  const grade = useGrader();
  const q = {
    branches: useGetBranchesQuery().data,
    sections: useGetSectionsQuery().data,
    students: useGetStudentsQuery().data,
    vouchers: useGetVouchersQuery().data,
    payments: useGetPaymentsQuery().data,
    registers: useGetRegistersQuery().data,
    staff: useGetStaffQuery().data,
    staffAttendance: useGetStaffAttendanceQuery().data,
    payrollRuns: useGetPayrollRunsQuery().data,
    payslips: useGetPayslipsQuery().data,
    exams: useGetExamsQuery().data,
    papers: useGetExamPapersQuery().data,
    marks: useGetExamMarksQuery().data,
    classSubjects: useGetClassSubjectsQuery().data,
    subjects: useGetSubjectsQuery().data,
  };
  if (!today || !branch || Object.values(q).some((v) => !v)) return null;
  return {
    today,
    branchId: branch.id,
    session,
    classes,
    grade,
    branches: q.branches!,
    sections: q.sections!,
    students: q.students!,
    vouchers: q.vouchers!,
    payments: q.payments!,
    registers: q.registers!,
    staff: q.staff!,
    staffAttendance: q.staffAttendance!,
    payrollRuns: q.payrollRuns!,
    payslips: q.payslips!,
    exams: q.exams!.filter((e) => e.branchId === branch.id && e.sessionId === session?.id),
    papers: q.papers!,
    marks: q.marks!,
    classSubjects: q.classSubjects!,
    subjects: q.subjects!,
  };
}
