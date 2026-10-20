/* Paper maker: the board → class → book → chapter → sub topic catalogue, the question bank, and papers. */

export type PaperQuestionType = "mcq" | "short" | "long";

export interface PaperBoard {
  id: string;
  /** "Punjab Textbook Board" */
  name: string;
  /** "PTB" */
  shortName: string;
}

export interface PaperClass {
  id: string;
  boardId: string;
  /** "Class 9" */
  name: string;
}

export interface PaperBook {
  id: string;
  boardId: string;
  classId: string;
  title: string;
  subject: string;
}

export interface PaperChapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
}

export interface PaperSubTopic {
  id: string;
  chapterId: string;
  title: string;
}

export interface PaperCatalog {
  boards: PaperBoard[];
  classes: PaperClass[];
  books: PaperBook[];
  chapters: PaperChapter[];
  subTopics: PaperSubTopic[];
}

/** A question in the bank, tagged with the sub topic it tests. */
export interface BankQuestion {
  id: string;
  subTopicId: string;
  type: PaperQuestionType;
  text: string;
  /** Four choices for multiple choice. */
  options?: string[];
  /** The correct option's letter for multiple choice, or a model answer. */
  answer: string;
}

/** A question on a paper: drawn from the bank (and possibly edited) or written by the teacher. */
export interface PaperQuestion {
  id: string;
  type: PaperQuestionType;
  text: string;
  options?: string[];
  answer: string;
  marks: number;
  subTopicId?: string;
  bankId?: string;
  /** Written by the teacher rather than drawn from the bank. */
  custom?: boolean;
}

/** How many questions of a type, and the marks for each. */
export interface BlueprintRow {
  type: PaperQuestionType;
  count: number;
  marks: number;
}

export interface PaperDetails {
  examName: string;
  date: string;
  /** "60 minutes" */
  timeAllowed: string;
  instructions: string;
}

export type PaperStatus = "draft" | "submitted" | "printed" | "returned";

export interface PaperEvent {
  at: string;
  by: string;
  action: "created" | "submitted" | "printed" | "returned";
  note?: string;
}

export interface Paper {
  id: string;
  branchId: string;
  /** Staff id of the teacher who owns the paper. */
  teacherId: string;
  teacherName: string;
  status: PaperStatus;
  /** The wizard step to reopen a draft on (1 to 6). */
  step: number;
  boardId: string;
  classId: string;
  bookId: string;
  subTopicIds: string[];
  blueprint: BlueprintRow[];
  questions: PaperQuestion[];
  details: PaperDetails;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  printedAt?: string;
  /** The note from the last return to the teacher. */
  returnNote?: string;
  history: PaperEvent[];
}

/** What a teacher sends when saving a draft. */
export type PaperDraftInput = Pick<Paper, "teacherId" | "branchId" | "step" | "boardId" | "classId" | "bookId" | "subTopicIds" | "blueprint" | "questions" | "details"> & {
  id?: string;
};
