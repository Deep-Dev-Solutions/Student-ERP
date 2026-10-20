import type { BlueprintRow, Paper, PaperCatalog, PaperQuestionType } from "@/types";

export const QUESTION_TYPES: { type: PaperQuestionType; label: string; section: string; heading: string }[] = [
  { type: "mcq", label: "Multiple choice", section: "A", heading: "Choose the correct answer." },
  { type: "short", label: "Short answer", section: "B", heading: "Answer briefly." },
  { type: "long", label: "Long answer", section: "C", heading: "Answer in detail." },
];
export const typeLabel = (t: PaperQuestionType) => QUESTION_TYPES.find((x) => x.type === t)?.label ?? t;

export const totalMarks = (p: Pick<Paper, "questions">) => p.questions.reduce((n, q) => n + q.marks, 0);

/** Names for a paper's board, class and book. */
export function scopeNames(p: Pick<Paper, "boardId" | "classId" | "bookId">, catalog: PaperCatalog | undefined) {
  const board = catalog?.boards.find((b) => b.id === p.boardId);
  const cls = catalog?.classes.find((c) => c.id === p.classId);
  const book = catalog?.books.find((b) => b.id === p.bookId);
  return { board: board?.shortName ?? "", boardName: board?.name ?? "", className: cls?.name ?? "", book: book?.title ?? "", subject: book?.subject ?? "" };
}

/** "13 Oct 2026" from "2026-10-13", without time-zone drift. */
export function paperDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Where a new paper's question types start. */
export const DEFAULT_BLUEPRINT: BlueprintRow[] = [
  { type: "mcq", count: 5, marks: 1 },
  { type: "short", count: 3, marks: 3 },
  { type: "long", count: 1, marks: 6 },
];
