export type ExamStatus = "upcoming" | "ongoing" | "completed";

export interface ExamTerm {
  id: string;
  title: string;
  termType: "midterm" | "final" | "monthly" | "quiz";
  academicYear: string;
  startDate: string;
  endDate: string;
  totalSubjects: number;
  classesIncluded: string[];
  status: ExamStatus;
}

/** One student's marks in the admin grid. */
export interface StudentMarksRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  avatar: string;
  className: string;
  section: string;
  obtainedMarks: number | "";
  maxMarks: number;
  remarks?: string;
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
