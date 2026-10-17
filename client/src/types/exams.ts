export type ExamStatus = "upcoming" | "ongoing" | "completed";
export type ExamType = "midterm" | "final" | "monthly" | "quiz";

/** An exam held across one or more classes at a campus. */
export interface Exam {
  id: string;
  branchId: string;
  sessionId: string;
  title: string;
  termType: ExamType;
  startDate: string;
  endDate: string;
  classIds: string[];
  /** Set when results are published; marks are then locked. */
  publishedAt?: string;
  createdBy: string;
}

/** One line of the date sheet: a subject's paper for a class. */
export interface ExamPaper {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  date: string;
  totalMarks: number;
  passMarks: number;
}

/** A student's marks in one paper. */
export interface ExamMark {
  id: string;
  examId: string;
  subjectId: string;
  studentId: string;
  /** Null while absent or not marked yet. */
  obtained: number | null;
  absent: boolean;
  remark?: string;
  updatedAt: string;
  updatedBy: string;
}

/** One student's marks on a teacher's mobile list. */
export interface StudentMarksItem {
  id: string;
  rollNo: string;
  name: string;
  avatar: string;
  obtainedMarks: number | "";
  maxMarks: number;
}
