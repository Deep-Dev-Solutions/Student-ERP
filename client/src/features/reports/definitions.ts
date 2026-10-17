/*
 * The reports in the Reports hub. Each one turns the store's data into
 * columns and rows; the screen, CSV export and printout all use the same rows.
 */
import { voucherBalance, voucherState, monthLabel } from "@/lib/fees";
import { computeResults, sectionRoster } from "@/lib/results";
import type {
  AcademicSession,
  AttendanceRegister,
  Branch,
  ClassSubject,
  Exam,
  ExamMark,
  ExamPaper,
  FeeVoucher,
  Payment,
  PayrollRun,
  Payslip,
  SchoolClass,
  Section,
  StaffAttendanceDay,
  StaffMember,
  Student,
  Subject,
} from "@/types";

export type ColumnKind = "text" | "number" | "money" | "percent";
export interface ReportColumn {
  key: string;
  label: string;
  kind?: ColumnKind;
}
export type ReportRow = Record<string, string | number | null>;
export interface ReportResult {
  columns: ReportColumn[];
  rows: ReportRow[];
  total?: ReportRow;
  /** Shown when there are no rows. */
  empty?: string;
}

export interface ReportData {
  today: string;
  branchId: string;
  branches: Branch[];
  session?: AcademicSession;
  classes: SchoolClass[];
  sections: Section[];
  students: Student[];
  vouchers: FeeVoucher[];
  payments: Payment[];
  registers: AttendanceRegister[];
  staff: StaffMember[];
  staffAttendance: StaffAttendanceDay[];
  payrollRuns: PayrollRun[];
  payslips: Payslip[];
  exams: Exam[];
  papers: ExamPaper[];
  marks: ExamMark[];
  classSubjects: ClassSubject[];
  subjects: Subject[];
  grade: (percent: number | null) => { label: string };
}

export type ReportParam = "month" | "exam";
export interface ReportParams {
  month: string;
  examId: string;
}

export interface ReportDefinition {
  id: string;
  group: "Fees" | "Attendance" | "Students" | "Staff and payroll" | "Exams" | "Branches";
  title: string;
  description: string;
  params: ReportParam[];
  build: (d: ReportData, p: ReportParams) => ReportResult;
}

const sum = <T,>(items: T[], f: (x: T) => number) => items.reduce((n, x) => n + f(x), 0);
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : null);

/** Months of the session up to the current month, oldest first. */
function sessionMonths(d: ReportData) {
  const start = (d.session?.startDate ?? `${d.today.slice(0, 4)}-01-01`).slice(0, 7);
  const end = d.today.slice(0, 7);
  const out: string[] = [];
  const date = new Date(`${start}-15T12:00:00`);
  while (date.toISOString().slice(0, 7) <= end && out.length < 24) {
    out.push(date.toISOString().slice(0, 7));
    date.setMonth(date.getMonth() + 1);
  }
  return out;
}

const branchStudents = (d: ReportData, branchId = d.branchId) => d.students.filter((s) => s.branchId === branchId && s.enrollment === "active");
const live = (v: FeeVoucher) => v.status !== "cancelled";
const dailyRegisters = (d: ReportData, month: string, branchId = d.branchId) =>
  d.registers.filter((r) => r.branchId === branchId && !r.subjectId && r.date.startsWith(month));
const sectionName = (d: ReportData, id: string) => {
  const s = d.sections.find((x) => x.id === id);
  return `${d.classes.find((c) => c.id === s?.classId)?.name ?? ""}, section ${s?.name ?? ""}`;
};

export const REPORTS: ReportDefinition[] = [
  {
    id: "fee-collection",
    group: "Fees",
    title: "Collection by month",
    description: "Fees billed and collected each month of the session.",
    params: [],
    build: (d) => {
      const vouchers = d.vouchers.filter((v) => v.branchId === d.branchId && live(v));
      const rows = sessionMonths(d).map((month) => {
        const mine = vouchers.filter((v) => v.month === month);
        const billed = sum(mine, (v) => v.totalAmount);
        const collected = sum(mine, (v) => v.paidAmount);
        return { month: monthLabel(month), vouchers: mine.length, billed, collected, outstanding: billed - collected, rate: pct(collected, billed) };
      });
      const billed = sum(rows, (r) => r.billed);
      const collected = sum(rows, (r) => r.collected);
      return {
        columns: [
          { key: "month", label: "Month" },
          { key: "vouchers", label: "Vouchers", kind: "number" },
          { key: "billed", label: "Billed", kind: "money" },
          { key: "collected", label: "Collected", kind: "money" },
          { key: "outstanding", label: "Outstanding", kind: "money" },
          { key: "rate", label: "Collection rate", kind: "percent" },
        ],
        rows,
        total: { month: "Total", vouchers: sum(rows, (r) => r.vouchers), billed, collected, outstanding: billed - collected, rate: pct(collected, billed) },
      };
    },
  },
  {
    id: "fee-outstanding",
    group: "Fees",
    title: "Outstanding by class",
    description: "What each class owes, how much is overdue, and how many families are behind.",
    params: [],
    build: (d) => {
      const rows = d.classes.map((c) => {
        const vouchers = d.vouchers.filter((v) => v.branchId === d.branchId && v.classId === c.id && live(v));
        const billed = sum(vouchers, (v) => v.totalAmount);
        const collected = sum(vouchers, (v) => v.paidAmount);
        const overdueVouchers = vouchers.filter((v) => voucherState(v, d.today) === "overdue");
        return {
          class: c.name,
          students: branchStudents(d).filter((s) => s.classId === c.id).length,
          billed,
          collected,
          outstanding: billed - collected,
          overdue: sum(overdueVouchers, voucherBalance),
          behind: new Set(overdueVouchers.map((v) => v.studentId)).size,
        };
      });
      return {
        columns: [
          { key: "class", label: "Class" },
          { key: "students", label: "Students", kind: "number" },
          { key: "billed", label: "Billed", kind: "money" },
          { key: "collected", label: "Collected", kind: "money" },
          { key: "outstanding", label: "Outstanding", kind: "money" },
          { key: "overdue", label: "Overdue", kind: "money" },
          { key: "behind", label: "Families behind", kind: "number" },
        ],
        rows,
        total: {
          class: "Total",
          students: sum(rows, (r) => r.students),
          billed: sum(rows, (r) => r.billed),
          collected: sum(rows, (r) => r.collected),
          outstanding: sum(rows, (r) => r.outstanding),
          overdue: sum(rows, (r) => r.overdue),
          behind: sum(rows, (r) => r.behind),
        },
      };
    },
  },
  {
    id: "fee-daily",
    group: "Fees",
    title: "Collections by day",
    description: "Receipts for each day of a month by payment method. Reversed payments are left out.",
    params: ["month"],
    build: (d, p) => {
      const payments = d.payments.filter((x) => x.branchId === d.branchId && !x.reversed && x.at.startsWith(p.month));
      const days = [...new Set(payments.map((x) => x.at.slice(0, 10)))].sort();
      const by = (list: Payment[], m: Payment["method"][]) => sum(list.filter((x) => m.includes(x.method)), (x) => x.amount + x.lateFine);
      const rows = days.map((day) => {
        const list = payments.filter((x) => x.at.startsWith(day));
        return {
          day: new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
          receipts: list.length,
          cash: by(list, ["cash"]),
          bank: by(list, ["bank", "cheque"]),
          wallet: by(list, ["easypaisa"]),
          fines: sum(list, (x) => x.lateFine),
          total: sum(list, (x) => x.amount + x.lateFine),
        };
      });
      return {
        columns: [
          { key: "day", label: "Day" },
          { key: "receipts", label: "Receipts", kind: "number" },
          { key: "cash", label: "Cash", kind: "money" },
          { key: "bank", label: "Bank and cheque", kind: "money" },
          { key: "wallet", label: "Mobile wallet", kind: "money" },
          { key: "fines", label: "Late fines", kind: "money" },
          { key: "total", label: "Total", kind: "money" },
        ],
        rows,
        total: rows.length
          ? { day: "Total", receipts: sum(rows, (r) => r.receipts), cash: sum(rows, (r) => r.cash), bank: sum(rows, (r) => r.bank), wallet: sum(rows, (r) => r.wallet), fines: sum(rows, (r) => r.fines), total: sum(rows, (r) => r.total) }
          : undefined,
        empty: `No payments were received in ${monthLabel(p.month)}.`,
      };
    },
  },
  {
    id: "attendance-class",
    group: "Attendance",
    title: "Attendance by section",
    description: "Days marked and the share of students present in each section for a month.",
    params: ["month"],
    build: (d, p) => {
      const registers = dailyRegisters(d, p.month);
      const rows = [...new Set(registers.map((r) => r.sectionId))]
        .map((sectionId) => {
          const list = registers.filter((r) => r.sectionId === sectionId);
          const marks = list.flatMap((r) => Object.values(r.marks));
          const present = marks.filter((m) => m.status === "present").length;
          return {
            section: sectionName(d, sectionId),
            days: list.length,
            marks: marks.length,
            present: pct(present, marks.length),
            absences: marks.filter((m) => m.status === "absent").length,
            leave: marks.filter((m) => m.status === "leave").length,
          };
        })
        .sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true }));
      const marks = registers.flatMap((r) => Object.values(r.marks));
      return {
        columns: [
          { key: "section", label: "Section" },
          { key: "days", label: "Days marked", kind: "number" },
          { key: "marks", label: "Student-days", kind: "number" },
          { key: "present", label: "Present", kind: "percent" },
          { key: "absences", label: "Absences", kind: "number" },
          { key: "leave", label: "Leave", kind: "number" },
        ],
        rows,
        total: rows.length
          ? { section: "All sections", days: registers.length, marks: marks.length, present: pct(marks.filter((m) => m.status === "present").length, marks.length), absences: sum(rows, (r) => r.absences), leave: sum(rows, (r) => r.leave) }
          : undefined,
        empty: `No registers were submitted in ${monthLabel(p.month)}.`,
      };
    },
  },
  {
    id: "attendance-low",
    group: "Attendance",
    title: "Students below 80%",
    description: "Students present on fewer than 80% of the days marked in a month, lowest first.",
    params: ["month"],
    build: (d, p) => {
      const registers = dailyRegisters(d, p.month);
      const rows = branchStudents(d)
        .map((s) => {
          const marks = registers.map((r) => r.marks[s.id]).filter(Boolean);
          const present = marks.filter((m) => m.status === "present").length;
          return {
            student: `${s.name} (${s.id})`,
            section: sectionName(d, s.sectionId),
            days: marks.length,
            present,
            absent: marks.filter((m) => m.status === "absent").length,
            leave: marks.filter((m) => m.status === "leave").length,
            rate: pct(present, marks.length),
          };
        })
        .filter((r) => r.days > 0 && (r.rate ?? 100) < 80)
        .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0));
      return {
        columns: [
          { key: "student", label: "Student" },
          { key: "section", label: "Section" },
          { key: "days", label: "Days", kind: "number" },
          { key: "present", label: "Present", kind: "number" },
          { key: "absent", label: "Absent", kind: "number" },
          { key: "leave", label: "Leave", kind: "number" },
          { key: "rate", label: "Attendance", kind: "percent" },
        ],
        rows,
        empty: `Every student marked in ${monthLabel(p.month)} was present at least 80% of the time.`,
      };
    },
  },
  {
    id: "enrolment",
    group: "Students",
    title: "Enrolment by class",
    description: "Active students by class and gender against the seats available.",
    params: [],
    build: (d) => {
      const rows = d.classes.map((c) => {
        const list = branchStudents(d).filter((s) => s.classId === c.id);
        const secs = d.sections.filter((s) => s.classId === c.id);
        const capacity = sum(secs, (s) => s.capacity);
        return { class: c.name, sections: secs.length, boys: list.filter((s) => s.gender === "male").length, girls: list.filter((s) => s.gender === "female").length, total: list.length, capacity, filled: pct(list.length, capacity) };
      });
      const total = sum(rows, (r) => r.total);
      const capacity = sum(rows, (r) => r.capacity);
      return {
        columns: [
          { key: "class", label: "Class" },
          { key: "sections", label: "Sections", kind: "number" },
          { key: "boys", label: "Boys", kind: "number" },
          { key: "girls", label: "Girls", kind: "number" },
          { key: "total", label: "Students", kind: "number" },
          { key: "capacity", label: "Seats", kind: "number" },
          { key: "filled", label: "Filled", kind: "percent" },
        ],
        rows,
        total: { class: "Total", sections: sum(rows, (r) => r.sections), boys: sum(rows, (r) => r.boys), girls: sum(rows, (r) => r.girls), total, capacity, filled: pct(total, capacity) },
      };
    },
  },
  {
    id: "admissions",
    group: "Students",
    title: "Admissions and withdrawals",
    description: "Students admitted and withdrawn each month of the session.",
    params: [],
    build: (d) => {
      const all = d.students.filter((s) => s.branchId === d.branchId);
      const rows = sessionMonths(d).map((month) => {
        const admitted = all.filter((s) => s.admissionDate.startsWith(month)).length;
        const withdrawn = all.filter((s) => s.withdrawal?.date.startsWith(month)).length;
        return { month: monthLabel(month), admitted, withdrawn, net: admitted - withdrawn };
      });
      return {
        columns: [
          { key: "month", label: "Month" },
          { key: "admitted", label: "Admitted", kind: "number" },
          { key: "withdrawn", label: "Withdrawn", kind: "number" },
          { key: "net", label: "Net change", kind: "number" },
        ],
        rows,
        total: { month: "Total", admitted: sum(rows, (r) => r.admitted), withdrawn: sum(rows, (r) => r.withdrawn), net: sum(rows, (r) => r.net) },
      };
    },
  },
  {
    id: "payroll-summary",
    group: "Staff and payroll",
    title: "Payroll by month",
    description: "Salaries, deductions and tax for each payroll run.",
    params: [],
    build: (d) => {
      const runs = d.payrollRuns.filter((r) => r.branchId === d.branchId).sort((a, b) => a.month.localeCompare(b.month));
      const rows = runs.map((run) => {
        const slips = d.payslips.filter((s) => s.runId === run.id);
        return {
          month: monthLabel(run.month),
          staff: slips.length,
          gross: sum(slips, (s) => s.gross),
          deductions: sum(slips, (s) => s.totalDeductions),
          tax: sum(slips, (s) => s.tax),
          net: sum(slips, (s) => s.net),
          status: run.status === "paid" ? "Paid" : run.status === "finalised" ? "Finalised" : "Draft",
        };
      });
      return {
        columns: [
          { key: "month", label: "Month" },
          { key: "staff", label: "Staff", kind: "number" },
          { key: "gross", label: "Gross", kind: "money" },
          { key: "deductions", label: "Deductions", kind: "money" },
          { key: "tax", label: "Income tax", kind: "money" },
          { key: "net", label: "Net pay", kind: "money" },
          { key: "status", label: "Status" },
        ],
        rows,
        total: rows.length ? { month: "Total", staff: null, gross: sum(rows, (r) => r.gross), deductions: sum(rows, (r) => r.deductions), tax: sum(rows, (r) => r.tax), net: sum(rows, (r) => r.net), status: "" } : undefined,
        empty: "No payroll has been run yet.",
      };
    },
  },
  {
    id: "staff-attendance",
    group: "Staff and payroll",
    title: "Staff attendance",
    description: "Days present, late, absent and on leave for each staff member in a month.",
    params: ["month"],
    build: (d, p) => {
      const days = d.staffAttendance.filter((x) => x.branchId === d.branchId && x.date.startsWith(p.month));
      const rows = d.staff
        .filter((m) => m.branchId === d.branchId && m.status !== "terminated")
        .map((m) => {
          const marks = days.map((x) => x.marks[m.staffId]).filter(Boolean);
          const count = (s: string) => marks.filter((x) => x === s).length;
          return { name: m.name, department: m.department, present: count("present"), late: count("late"), absent: count("absent"), leave: count("leave") };
        });
      return {
        columns: [
          { key: "name", label: "Name" },
          { key: "department", label: "Department" },
          { key: "present", label: "Present", kind: "number" },
          { key: "late", label: "Late", kind: "number" },
          { key: "absent", label: "Absent", kind: "number" },
          { key: "leave", label: "Leave", kind: "number" },
        ],
        rows: days.length ? rows : [],
        empty: `Staff attendance wasn't marked in ${monthLabel(p.month)}.`,
      };
    },
  },
  {
    id: "exam-classes",
    group: "Exams",
    title: "Exam results by class",
    description: "Pass rate, average and top student in each class for an exam.",
    params: ["exam"],
    build: (d, p) => {
      const exam = d.exams.find((e) => e.id === p.examId);
      if (!exam) return { columns: [], rows: [], empty: "Choose an exam." };
      const rows = d.classes
        .filter((c) => exam.classIds.includes(c.id))
        .map((c) => {
          const papers = d.papers.filter((x) => x.examId === exam.id && x.classId === c.id);
          const roster = d.sections.filter((s) => s.classId === c.id).flatMap((s) => sectionRoster(d.students, s.id));
          const results = computeResults(roster, papers, d.marks, d.classSubjects);
          const complete = results.filter((r) => r.percent !== null);
          const top = results.find((r) => r.position === 1);
          return {
            class: c.name,
            students: results.length,
            complete: complete.length,
            passed: results.filter((r) => r.result === "pass").length,
            rate: pct(results.filter((r) => r.result === "pass").length, complete.length),
            average: complete.length ? Math.round((sum(complete, (r) => r.percent!) / complete.length) * 10) / 10 : null,
            top: top ? `${top.student.name}, ${top.percent}%` : "",
          };
        });
      return {
        columns: [
          { key: "class", label: "Class" },
          { key: "students", label: "Students", kind: "number" },
          { key: "complete", label: "All papers marked", kind: "number" },
          { key: "passed", label: "Passed", kind: "number" },
          { key: "rate", label: "Pass rate", kind: "percent" },
          { key: "average", label: "Average", kind: "percent" },
          { key: "top", label: "Top student" },
        ],
        rows,
      };
    },
  },
  {
    id: "exam-subjects",
    group: "Exams",
    title: "Subject averages",
    description: "How each class did in each paper of an exam.",
    params: ["exam"],
    build: (d, p) => {
      const exam = d.exams.find((e) => e.id === p.examId);
      if (!exam) return { columns: [], rows: [], empty: "Choose an exam." };
      const rows = d.papers
        .filter((x) => x.examId === exam.id)
        .map((paper) => {
          const ids = new Set(d.students.filter((s) => s.classId === paper.classId).map((s) => s.id));
          const marks = d.marks.filter((m) => m.examId === exam.id && m.subjectId === paper.subjectId && ids.has(m.studentId));
          const scores = marks.filter((m) => !m.absent && m.obtained !== null).map((m) => (m.obtained! / paper.totalMarks) * 100);
          return {
            class: d.classes.find((c) => c.id === paper.classId)?.name ?? "",
            subject: d.subjects.find((s) => s.id === paper.subjectId)?.name ?? "",
            marked: marks.length,
            average: scores.length ? Math.round((sum(scores, (x) => x) / scores.length) * 10) / 10 : null,
            highest: scores.length ? Math.round(Math.max(...scores) * 10) / 10 : null,
            lowest: scores.length ? Math.round(Math.min(...scores) * 10) / 10 : null,
            failed: marks.filter((m) => m.absent || (m.obtained ?? 0) < paper.passMarks).length,
          };
        })
        .filter((r) => r.marked > 0)
        .sort((a, b) => d.classes.findIndex((c) => c.name === a.class) - d.classes.findIndex((c) => c.name === b.class) || a.subject.localeCompare(b.subject));
      return {
        columns: [
          { key: "class", label: "Class" },
          { key: "subject", label: "Subject" },
          { key: "marked", label: "Marked", kind: "number" },
          { key: "average", label: "Average", kind: "percent" },
          { key: "highest", label: "Highest", kind: "percent" },
          { key: "lowest", label: "Lowest", kind: "percent" },
          { key: "failed", label: "Below pass", kind: "number" },
        ],
        rows,
        empty: "No marks have been entered for this exam yet.",
      };
    },
  },
  {
    id: "branches",
    group: "Branches",
    title: "Branch comparison",
    description: "Students, staff, attendance and fees side by side for every campus.",
    params: ["month"],
    build: (d, p) => {
      const rows = d.branches.map((b) => {
        const marks = dailyRegisters(d, p.month, b.id).flatMap((r) => Object.values(r.marks));
        const vouchers = d.vouchers.filter((v) => v.branchId === b.id && live(v));
        const monthVouchers = vouchers.filter((v) => v.month === p.month);
        return {
          branch: b.name,
          students: branchStudents(d, b.id).length,
          staff: d.staff.filter((m) => m.branchId === b.id && m.status !== "terminated").length,
          attendance: pct(marks.filter((m) => m.status === "present").length, marks.length),
          billed: sum(monthVouchers, (v) => v.totalAmount),
          collected: sum(monthVouchers, (v) => v.paidAmount),
          overdue: sum(vouchers.filter((v) => voucherState(v, d.today) === "overdue"), voucherBalance),
        };
      });
      return {
        columns: [
          { key: "branch", label: "Campus" },
          { key: "students", label: "Students", kind: "number" },
          { key: "staff", label: "Staff", kind: "number" },
          { key: "attendance", label: "Attendance", kind: "percent" },
          { key: "billed", label: "Billed this month", kind: "money" },
          { key: "collected", label: "Collected this month", kind: "money" },
          { key: "overdue", label: "Overdue", kind: "money" },
        ],
        rows,
        total: {
          branch: "All campuses",
          students: sum(rows, (r) => r.students),
          staff: sum(rows, (r) => r.staff),
          attendance: null,
          billed: sum(rows, (r) => r.billed),
          collected: sum(rows, (r) => r.collected),
          overdue: sum(rows, (r) => r.overdue),
        },
      };
    },
  },
];
