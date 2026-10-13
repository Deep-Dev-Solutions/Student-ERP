export interface SchoolClass {
  id: string;
  branchId: string;
  /** e.g. "Class 9" */
  name: string;
  /** Sort order within the branch. */
  order: number;
  /** Optional stage shown with the name, e.g. "Matric". */
  stage?: string;
}

export interface Section {
  id: string;
  classId: string;
  /** e.g. "A" */
  name: string;
  shift: "morning" | "evening";
  capacity: number;
  /** Staff id of the class incharge. */
  inchargeId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

/** A subject taught in a class; electives are taken by some students only. */
export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  elective: boolean;
}
