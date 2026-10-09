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

