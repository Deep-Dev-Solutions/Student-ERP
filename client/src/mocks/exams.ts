/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import { classSubjects } from "./academics";
import { schoolRules } from "./settings";
import { students } from "./students";
import type { Exam, ExamMark, ExamPaper } from "@/types";

/*
 * Mid-term is in progress (the first papers are marked), September's monthly
 * test is finished and published, and the annual exam has no date sheet yet.
 */
export const exams: Exam[] = [
  { id: "ex-1", branchId: "br-1", sessionId: "2026-2027", title: "Mid-term exam 2026", termType: "midterm", startDate: "2026-10-12", endDate: "2026-10-23", classIds: ["br-1-8", "br-1-9", "br-1-10"], createdBy: "Usman Qureshi (Principal)" },
  { id: "ex-2", branchId: "br-1", sessionId: "2026-2027", title: "Monthly test, September", termType: "monthly", startDate: "2026-09-22", endDate: "2026-09-30", classIds: ["br-1-9", "br-1-10"], publishedAt: "2026-10-03T10:00:00", createdBy: "Usman Qureshi (Principal)" },
  { id: "ex-3", branchId: "br-1", sessionId: "2026-2027", title: "Annual board preparation exam", termType: "final", startDate: "2026-12-10", endDate: "2026-12-24", classIds: ["br-1-10"], createdBy: "Usman Qureshi (Principal)" },
];

/** Weekdays from a start date, as ISO dates. */
function weekdays(start: string, count: number) {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00`);
  while (out.length < count) {
    if (d.getDay() !== 0) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const passFor = (totalMarks: number) => Math.ceil((totalMarks * schoolRules.grading.passPercent) / 100);

const sheet = (examId: string, start: string, totalMarks: number) =>
  exams
    .find((e) => e.id === examId)!
    .classIds.flatMap((classId) => {
      const subjects = classSubjects.filter((cs) => cs.classId === classId);
      const dates = weekdays(start, subjects.length);
      return subjects.map((cs, i): ExamPaper => ({ id: `pap-${examId}-${cs.id}`, examId, classId, subjectId: cs.subjectId, date: dates[i], totalMarks, passMarks: passFor(totalMarks) }));
    });

export const examPapers: ExamPaper[] = [...sheet("ex-1", "2026-10-12", 75), ...sheet("ex-2", "2026-09-22", 25)];

/** A repeatable score between 0 and 1 for a student and subject. */
const score = (studentId: string, subjectId: string, salt: number) => {
  let h = salt;
  for (const ch of studentId + subjectId) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return 0.35 + ((h % 61) / 100);
};

const takes = (studentId: string, paper: ExamPaper) => {
  const s = students.find((x) => x.id === studentId)!;
  const offered = classSubjects.find((cs) => cs.classId === paper.classId && cs.subjectId === paper.subjectId);
  return s.enrollment === "active" && s.classId === paper.classId && (!offered?.elective || s.electiveSubjectIds.includes(paper.subjectId));
};

export const examMarks: ExamMark[] = examPapers
  .filter((p) => p.examId === "ex-2" || p.date < "2026-10-15")
  .flatMap((paper) =>
    students
      .filter((s) => takes(s.id, paper))
      .map((s, i): ExamMark => {
        const absent = paper.examId === "ex-1" && i === 1 && paper.subjectId === "sub-eng";
        return {
          id: `mk-${paper.id}-${s.id}`,
          examId: paper.examId,
          subjectId: paper.subjectId,
          studentId: s.id,
          obtained: absent ? null : Math.min(paper.totalMarks, Math.round(paper.totalMarks * score(s.id, paper.subjectId, paper.examId === "ex-1" ? 7 : 3))),
          absent,
          updatedAt: `${paper.date}T15:00:00`,
          updatedBy: "Class teacher",
        };
      })
  );
