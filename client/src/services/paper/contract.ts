/*
 * Paper service contract. The screens call these operations through the RTK
 * Query API; today they run against the in-memory mock (mockPaperService.ts).
 * The backend implements the same operations at the paths below, and must
 * enforce every permission listed here: the UI only hides controls.
 */
import type { BankQuestion, Paper, PaperCatalog, PaperDraftInput, PaperStatus } from "@/types";

/** The permission flag that allows printing. The backend maps it to whichever roles it likes. */
export const PRINT_PERMISSION = "canPrintPapers";

export type ServiceError = { status: number; message: string };
export type ServiceResult<T> = { data: T } | { error: ServiceError };

/** Who is calling. The real API reads this from the sign-in token, never from the request body. */
export interface CallerContext {
  name: string;
  /** Staff id of the signed-in teacher, when there is one. */
  staffId?: string;
  canPrintPapers: boolean;
  /** Platform staff who manage the global catalogue and question bank from the Console. */
  isPlatformAdmin?: boolean;
}

export type CatalogKind = "board" | "class" | "book" | "chapter" | "subTopic";

/** Adds (no id) or renames (with id) one node of the catalogue. */
export interface CatalogItemInput {
  kind: CatalogKind;
  id?: string;
  /** The board for a class, the class for a book, the book for a chapter, the chapter for a sub topic. */
  parentId?: string;
  name: string;
  /** Board short name (e.g. "PTB") or book subject (e.g. "Physics"). */
  extra?: string;
}

export interface PaperService {
  /** Boards, classes, books, chapters and sub topics. Any signed-in user. */
  getCatalog(ctx: CallerContext): ServiceResult<PaperCatalog>;
  /** Questions for the given sub topics. Teachers and anyone with the print permission. */
  getQuestionBank(ctx: CallerContext, subTopicIds: string[]): ServiceResult<BankQuestion[]>;
  /** Papers the caller may see: their own, plus every non-draft paper when they can print. */
  listPapers(ctx: CallerContext): ServiceResult<Paper[]>;
  /** Creates a draft, or saves an existing draft or returned paper. Owner only. */
  saveDraft(ctx: CallerContext, input: PaperDraftInput): ServiceResult<Paper>;
  /** Draft or returned → submitted, after checking the paper is complete. Owner only. */
  submit(ctx: CallerContext, paperId: string): ServiceResult<Paper>;
  /** Submitted → printed. Requires canPrintPapers. */
  markPrinted(ctx: CallerContext, paperId: string): ServiceResult<Paper>;
  /** Submitted → returned, with a note for the teacher. Requires canPrintPapers. */
  returnToTeacher(ctx: CallerContext, paperId: string, note: string): ServiceResult<Paper>;
  /** The printable paper or answer key (PDF on the real API). Requires canPrintPapers. */
  getPrintable(ctx: CallerContext, paperId: string, answerKey: boolean): ServiceResult<Paper>;
  /** Adds or renames a board, class, book, chapter or sub topic. Platform admins only. */
  saveCatalogItem(ctx: CallerContext, input: CatalogItemInput): ServiceResult<PaperCatalog>;
  /** Removes a catalogue node that has nothing under it and no questions. Platform admins only. */
  deleteCatalogItem(ctx: CallerContext, kind: CatalogKind, id: string): ServiceResult<PaperCatalog>;
  /** Adds (no id) or edits a question in the global bank. Platform admins only. */
  saveBankQuestion(ctx: CallerContext, input: Omit<BankQuestion, "id"> & { id?: string }): ServiceResult<BankQuestion>;
  /** Removes a question from the bank; papers that already use it keep their copy. Platform admins only. */
  deleteBankQuestion(ctx: CallerContext, id: string): ServiceResult<null>;
}

/** The HTTP endpoints the backend builds, and the check each one needs. */
export const PAPER_ENDPOINTS: { operation: keyof PaperService; method: "GET" | "POST" | "PUT"; path: string; access: string }[] = [
  { operation: "getCatalog", method: "GET", path: "/api/paper-catalog", access: "Any signed-in user" },
  { operation: "getQuestionBank", method: "GET", path: "/api/question-bank?subTopicIds=…", access: "Teachers, or canPrintPapers" },
  { operation: "listPapers", method: "GET", path: "/api/papers?status=…", access: "Own papers; all non-draft papers with canPrintPapers" },
  { operation: "saveDraft", method: "POST", path: "/api/papers (create) · PUT /api/papers/:id (save)", access: "Owner; status must be draft or returned" },
  { operation: "submit", method: "POST", path: "/api/papers/:id/submit", access: "Owner; status must be draft or returned; paper complete" },
  { operation: "markPrinted", method: "POST", path: "/api/papers/:id/printed", access: "canPrintPapers; status must be submitted" },
  { operation: "returnToTeacher", method: "POST", path: "/api/papers/:id/return", access: "canPrintPapers; status must be submitted; note required" },
  { operation: "getPrintable", method: "GET", path: "/api/papers/:id/pdf?answerKey=true|false", access: "canPrintPapers; status submitted or printed" },
  { operation: "saveCatalogItem", method: "POST", path: "/api/console/paper-catalog (add) · PUT /api/console/paper-catalog/:kind/:id (rename)", access: "Platform admin" },
  { operation: "deleteCatalogItem", method: "POST", path: "/api/console/paper-catalog/:kind/:id/delete", access: "Platform admin; nothing under it and no questions" },
  { operation: "saveBankQuestion", method: "POST", path: "/api/console/question-bank (add) · PUT /api/console/question-bank/:id", access: "Platform admin" },
  { operation: "deleteBankQuestion", method: "POST", path: "/api/console/question-bank/:id/delete", access: "Platform admin" },
];

export const PAPER_STATUS_LABELS: Record<PaperStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  printed: "Printed",
  returned: "Returned",
};

/** Why a paper can't be submitted yet, or null when it's complete. Shared by the UI and the service. */
export function paperProblem(p: Pick<Paper, "boardId" | "classId" | "bookId" | "subTopicIds" | "questions" | "details">): string | null {
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
