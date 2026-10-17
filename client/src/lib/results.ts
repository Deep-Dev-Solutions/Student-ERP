/*
 * Exam status, roll numbers and result sheets, shared by the exam screens,
 * the student profile and the report card.
 */
import type { ClassSubject, Exam, ExamMark, ExamPaper, ExamStatus, Student } from "@/types";

export function examStatus(exam: Pick<Exam, "startDate" | "endDate">, today: string | null): ExamStatus {
  if (!today || today < exam.startDate) return "upcoming";
  return today > exam.endDate ? "completed" : "ongoing";
}

/** Active students in a section, in roll-number order (by name), with their roll numbers. */
export function sectionRoster(students: Student[], sectionId: string) {
  return students
    .filter((s) => s.sectionId === sectionId && s.enrollment === "active")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student, i) => ({ student, rollNo: String(i + 1).padStart(2, "0") }));
}

/** Whether a student sits a paper: core subjects for everyone, electives only for those who chose them. */
export function sitsPaper(student: Student, paper: Pick<ExamPaper, "classId" | "subjectId">, classSubjects: ClassSubject[]) {
  const offered = classSubjects.find((cs) => cs.classId === paper.classId && cs.subjectId === paper.subjectId);
  return student.classId === paper.classId && (!offered?.elective || student.electiveSubjectIds.includes(paper.subjectId));
}

export interface SubjectResult {
  paper: ExamPaper;
  mark?: ExamMark;
  /** Marks obtained, or null if absent or not marked. */
  obtained: number | null;
  passed: boolean;
}

export interface StudentResult {
  student: Student;
  rollNo: string;
  subjects: SubjectResult[];
  obtained: number;
  total: number;
  percent: number | null;
  /** "incomplete" while any paper is unmarked. */
  result: "pass" | "fail" | "incomplete";
  failedIn: string[];
  /** Position in the group ranked (shared on a tie), when complete. */
  position: number | null;
}

/** Works out results for a roster: each subject must reach its pass marks, and absence counts as a fail. */
export function computeResults(
  roster: { student: Student; rollNo: string }[],
  papers: ExamPaper[],
  marks: ExamMark[],
  classSubjects: ClassSubject[]
): StudentResult[] {
  const rows = roster.map(({ student, rollNo }): StudentResult => {
    const subjects = papers
      .filter((p) => sitsPaper(student, p, classSubjects))
      .map((paper) => {
        const mark = marks.find((m) => m.examId === paper.examId && m.subjectId === paper.subjectId && m.studentId === student.id);
        const obtained = mark && !mark.absent ? mark.obtained : null;
        return { paper, mark, obtained, passed: obtained !== null && obtained >= paper.passMarks };
      });
    const complete = subjects.length > 0 && subjects.every((s) => s.mark && (s.mark.absent || s.mark.obtained !== null));
    const obtained = subjects.reduce((n, s) => n + (s.obtained ?? 0), 0);
    const total = subjects.reduce((n, s) => n + s.paper.totalMarks, 0);
    const failedIn = subjects.filter((s) => s.mark && !s.passed).map((s) => s.paper.subjectId);
    return {
      student,
      rollNo,
      subjects,
      obtained,
      total,
      percent: complete && total ? Math.round((obtained / total) * 1000) / 10 : null,
      result: !complete ? "incomplete" : failedIn.length ? "fail" : "pass",
      failedIn,
      position: null,
    };
  });
  return rankResults(rows);
}

/** Competition ranking (1, 1, 3) by percentage among complete results. */
export function rankResults(rows: StudentResult[]) {
  const ranked = rows.filter((r) => r.percent !== null).sort((a, b) => b.percent! - a.percent!);
  return rows.map((r) => (r.percent === null ? r : { ...r, position: ranked.findIndex((x) => x.percent === r.percent) + 1 }));
}

export function ordinal(n: number) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}
