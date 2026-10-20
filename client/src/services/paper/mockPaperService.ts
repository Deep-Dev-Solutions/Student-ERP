/*
 * In-memory implementation of the paper service contract. It applies the same
 * permission and status rules the backend must, so the screens behave the same
 * way once the real API replaces it.
 */
import { db } from "@/mocks/db";
import type { Paper, PaperCatalog } from "@/types";
import { paperProblem, type CallerContext, type CatalogKind, type PaperService, type ServiceResult } from "./contract";

const fail = (status: number, message: string) => ({ error: { status, message } });
const now = () => new Date().toISOString();
const newId = () => `pap-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const teacherNameOf = (staffId: string) => db.staff.find((m) => m.staffId === staffId)?.name ?? staffId;

function replace(paper: Paper): ServiceResult<Paper> {
  db.papers = db.papers.some((p) => p.id === paper.id) ? db.papers.map((p) => (p.id === paper.id ? paper : p)) : [paper, ...db.papers];
  return { data: paper };
}

/** Ownership in the mock: an admin opening the teacher portal acts as the demo teacher, so the paper's teacher is trusted as sent. */
const catalogKeys: Record<CatalogKind, keyof PaperCatalog> = { board: "boards", class: "classes", book: "books", chapter: "chapters", subTopic: "subTopics" };
const platformOnly = (ctx: CallerContext) => (ctx.isPlatformAdmin ? null : fail(403, "Only platform admins can change the question bank"));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item";

const ownerOf = (ctx: CallerContext, paper: Pick<Paper, "teacherId">) => !ctx.staffId || ctx.staffId === paper.teacherId;

export const mockPaperService: PaperService = {
  getCatalog: () => ({ data: db.paperCatalog }),

  getQuestionBank: (_ctx, subTopicIds) => ({ data: db.questionBank.filter((q) => subTopicIds.includes(q.subTopicId)) }),

  listPapers: (ctx) => ({ data: db.papers.filter((p) => (ctx.staffId && p.teacherId === ctx.staffId) || (ctx.canPrintPapers && p.status !== "draft") || !ctx.staffId) }),

  saveDraft: (ctx, input) => {
    const existing = input.id ? db.papers.find((p) => p.id === input.id) : undefined;
    if (input.id && !existing) return fail(404, "Paper not found");
    if (existing && !ownerOf(ctx, existing)) return fail(403, "Only the teacher who made this paper can change it");
    if (existing && existing.status !== "draft" && existing.status !== "returned") return fail(409, "This paper has been submitted and can't be changed");
    const at = now();
    const paper: Paper = existing
      ? { ...existing, ...input, id: existing.id, updatedAt: at }
      : {
          ...input,
          id: newId(),
          teacherName: teacherNameOf(input.teacherId),
          status: "draft",
          createdAt: at,
          updatedAt: at,
          history: [{ at, by: ctx.name, action: "created" }],
        };
    return replace(paper);
  },

  submit: (ctx, paperId) => {
    const paper = db.papers.find((p) => p.id === paperId);
    if (!paper) return fail(404, "Paper not found");
    if (!ownerOf(ctx, paper)) return fail(403, "Only the teacher who made this paper can submit it");
    if (paper.status !== "draft" && paper.status !== "returned") return fail(409, "This paper is already submitted");
    const problem = paperProblem(paper);
    if (problem) return fail(400, problem);
    const at = now();
    return replace({ ...paper, status: "submitted", step: 6, submittedAt: at, updatedAt: at, history: [...paper.history, { at, by: ctx.name, action: "submitted" }] });
  },

  markPrinted: (ctx, paperId) => {
    if (!ctx.canPrintPapers) return fail(403, "You don't have permission to print papers");
    const paper = db.papers.find((p) => p.id === paperId);
    if (!paper) return fail(404, "Paper not found");
    if (paper.status !== "submitted") return fail(409, "Only a submitted paper can be marked printed");
    const at = now();
    return replace({ ...paper, status: "printed", printedAt: at, updatedAt: at, history: [...paper.history, { at, by: ctx.name, action: "printed" }] });
  },

  returnToTeacher: (ctx, paperId, note) => {
    if (!ctx.canPrintPapers) return fail(403, "You don't have permission to return papers");
    const paper = db.papers.find((p) => p.id === paperId);
    if (!paper) return fail(404, "Paper not found");
    if (paper.status !== "submitted") return fail(409, "Only a submitted paper can be returned");
    if (note.trim().length < 5) return fail(400, "Tell the teacher what to change");
    const at = now();
    return replace({ ...paper, status: "returned", returnNote: note.trim(), updatedAt: at, history: [...paper.history, { at, by: ctx.name, action: "returned", note: note.trim() }] });
  },

  saveCatalogItem: (ctx, input) => {
    const denied = platformOnly(ctx);
    if (denied) return denied;
    const name = input.name.trim();
    if (name.length < 2) return fail(400, "Enter a name");
    const c = db.paperCatalog;
    if (input.id) {
      const key = catalogKeys[input.kind];
      if (!(c[key] as { id: string }[]).some((x) => x.id === input.id)) return fail(404, "Not found");
      const rename = <T extends { id: string }>(list: T[], f: (x: T) => T) => list.map((x) => (x.id === input.id ? f(x) : x));
      db.paperCatalog = {
        ...c,
        boards: input.kind === "board" ? rename(c.boards, (b) => ({ ...b, name, shortName: input.extra?.trim() || b.shortName })) : c.boards,
        classes: input.kind === "class" ? rename(c.classes, (x) => ({ ...x, name })) : c.classes,
        books: input.kind === "book" ? rename(c.books, (b) => ({ ...b, title: name, subject: input.extra?.trim() || b.subject })) : c.books,
        chapters: input.kind === "chapter" ? rename(c.chapters, (x) => ({ ...x, title: name })) : c.chapters,
        subTopics: input.kind === "subTopic" ? rename(c.subTopics, (x) => ({ ...x, title: name })) : c.subTopics,
      };
      return { data: db.paperCatalog };
    }
    const id = `${input.parentId ? `${input.parentId}-` : ""}${slug(name)}-${Date.now().toString(36).slice(-4)}`;
    if (input.kind === "board") {
      if (!input.extra?.trim()) return fail(400, "Enter the board's short name");
      db.paperCatalog = { ...c, boards: [...c.boards, { id, name, shortName: input.extra.trim() }] };
    } else if (input.kind === "class") {
      if (!c.boards.some((b) => b.id === input.parentId)) return fail(400, "Choose a board");
      db.paperCatalog = { ...c, classes: [...c.classes, { id, boardId: input.parentId!, name }] };
    } else if (input.kind === "book") {
      const cls = c.classes.find((x) => x.id === input.parentId);
      if (!cls) return fail(400, "Choose a class");
      if (!input.extra?.trim()) return fail(400, "Enter the subject");
      db.paperCatalog = { ...c, books: [...c.books, { id, boardId: cls.boardId, classId: cls.id, title: name, subject: input.extra.trim() }] };
    } else if (input.kind === "chapter") {
      if (!c.books.some((b) => b.id === input.parentId)) return fail(400, "Choose a book");
      const number = c.chapters.filter((x) => x.bookId === input.parentId).length + 1;
      db.paperCatalog = { ...c, chapters: [...c.chapters, { id, bookId: input.parentId!, number, title: name }] };
    } else {
      if (!c.chapters.some((x) => x.id === input.parentId)) return fail(400, "Choose a chapter");
      db.paperCatalog = { ...c, subTopics: [...c.subTopics, { id, chapterId: input.parentId!, title: name }] };
    }
    return { data: db.paperCatalog };
  },

  deleteCatalogItem: (ctx, kind, id) => {
    const denied = platformOnly(ctx);
    if (denied) return denied;
    const c = db.paperCatalog;
    const hasChildren =
      (kind === "board" && c.classes.some((x) => x.boardId === id)) ||
      (kind === "class" && c.books.some((x) => x.classId === id)) ||
      (kind === "book" && c.chapters.some((x) => x.bookId === id)) ||
      (kind === "chapter" && c.subTopics.some((x) => x.chapterId === id)) ||
      (kind === "subTopic" && db.questionBank.some((q) => q.subTopicId === id));
    if (hasChildren) return fail(409, kind === "subTopic" ? "Delete its questions first" : "Delete what's under it first");
    const key = catalogKeys[kind];
    db.paperCatalog = { ...c, [key]: (c[key] as { id: string }[]).filter((x) => x.id !== id) };
    return { data: db.paperCatalog };
  },

  saveBankQuestion: (ctx, input) => {
    const denied = platformOnly(ctx);
    if (denied) return denied;
    if (!db.paperCatalog.subTopics.some((t) => t.id === input.subTopicId)) return fail(400, "Choose a sub topic");
    if (input.text.trim().length < 5) return fail(400, "Write the question");
    if (input.type === "mcq" && (input.options?.length !== 4 || input.options.some((o) => !o.trim()))) return fail(400, "Fill in all four choices");
    if (input.type === "mcq" && !["A", "B", "C", "D"].includes(input.answer)) return fail(400, "Choose the correct choice");
    const q = { ...input, text: input.text.trim(), answer: input.answer.trim(), options: input.type === "mcq" ? input.options?.map((o) => o.trim()) : undefined, id: input.id ?? `bq-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}` };
    if (input.id && !db.questionBank.some((x) => x.id === input.id)) return fail(404, "Question not found");
    db.questionBank = input.id ? db.questionBank.map((x) => (x.id === input.id ? q : x)) : [...db.questionBank, q];
    return { data: q };
  },

  deleteBankQuestion: (ctx, id) => {
    const denied = platformOnly(ctx);
    if (denied) return denied;
    if (!db.questionBank.some((x) => x.id === id)) return fail(404, "Question not found");
    db.questionBank = db.questionBank.filter((x) => x.id !== id);
    return { data: null };
  },

  getPrintable: (ctx, paperId) => {
    if (!ctx.canPrintPapers) return fail(403, "You don't have permission to print papers");
    const paper = db.papers.find((p) => p.id === paperId);
    if (!paper) return fail(404, "Paper not found");
    if (paper.status !== "submitted" && paper.status !== "printed") return fail(409, "Only submitted papers can be printed");
    return { data: paper };
  },
};
