// Ported from client/src/services/paper/contract.ts's paperProblem(), framework-free.

export type PaperQuestionType = "mcq" | "short" | "long";

export interface PaperQuestionLike {
  text: string;
  marks: number;
  type: PaperQuestionType;
  options?: string[];
}

export interface PaperDetailsLike {
  examName: string;
  date: string;
  timeAllowed: string;
}

export interface PaperLike {
  boardId: string;
  classId: string;
  bookId: string;
  subTopicIds: string[];
  questions: PaperQuestionLike[];
  details: PaperDetailsLike;
}

/** Why a paper can't be submitted yet, or null when it's complete. */
export function paperProblem(p: PaperLike): string | null {
  if (!p.boardId) return "Choose a board";
  if (!p.classId) return "Choose a class";
  if (!p.bookId) return "Choose a book";
  if (p.subTopicIds.length === 0) return "Pick at least one chapter or sub topic";
  if (p.questions.length === 0) return "Add at least one question";
  if (p.questions.some((q) => !q.text.trim() || q.marks <= 0)) return "Every question needs text and marks";
  if (p.questions.some((q) => q.type === "mcq" && (q.options?.length !== 4 || q.options.some((o) => !o.trim())))) return "Every multiple choice question needs four options";
  if (!p.details.examName.trim()) return "Enter the exam name";
  if (!p.details.date) return "Choose the exam date";
  if (!p.details.timeAllowed.trim()) return "Enter the time allowed";
  return null;
}
