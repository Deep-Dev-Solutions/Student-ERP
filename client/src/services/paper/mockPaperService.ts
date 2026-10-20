/*
 * In-memory implementation of the paper service contract. It applies the same
 * permission and status rules the backend must, so the screens behave the same
 * way once the real API replaces it.
 */
import { db } from "@/mocks/db";
import type { Paper } from "@/types";
import { paperProblem, type CallerContext, type PaperService, type ServiceResult } from "./contract";

const fail = (status: number, message: string) => ({ error: { status, message } });
const now = () => new Date().toISOString();
const newId = () => `pap-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const teacherNameOf = (staffId: string) => db.staff.find((m) => m.staffId === staffId)?.name ?? staffId;

function replace(paper: Paper): ServiceResult<Paper> {
  db.papers = db.papers.some((p) => p.id === paper.id) ? db.papers.map((p) => (p.id === paper.id ? paper : p)) : [paper, ...db.papers];
  return { data: paper };
}

/** Ownership in the mock: an admin opening the teacher portal acts as the demo teacher, so the paper's teacher is trusted as sent. */
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

  getPrintable: (ctx, paperId) => {
    if (!ctx.canPrintPapers) return fail(403, "You don't have permission to print papers");
    const paper = db.papers.find((p) => p.id === paperId);
    if (!paper) return fail(404, "Paper not found");
    if (paper.status !== "submitted" && paper.status !== "printed") return fail(409, "Only submitted papers can be printed");
    return { data: paper };
  },
};
