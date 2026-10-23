import { Injectable } from "@nestjs/common";
import { paperProblem } from "../../domain/paper";
import { AuditService } from "../../common/audit.service";
import { actorName, currentContext, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { hasPermission, type PermissionMatrix } from "../../common/permissions";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toBankQuestion, toPaper, toPaperCatalog } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { SaveDraftDto } from "./dto/save-draft.dto";

const PRINT_PERMISSION = "canPrintPapers";

@Injectable()
export class PaperMakerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Can print, return or finalise papers (same rule the client reads from the permission matrix). */
  private async canPrint() {
    const ctx = currentContext();
    const row = await this.prisma.tenant.tenantPermissions.findFirst();
    return hasPermission(ctx.role ?? "", PRINT_PERMISSION, (row?.matrix ?? {}) as PermissionMatrix);
  }

  /** getPaperCatalog: global reference data, the same for every school. */
  async getCatalog() {
    const [boards, classes, books, chapters, subTopics] = await Promise.all([
      this.prisma.system.paperBoard.findMany(),
      this.prisma.system.paperClass.findMany(),
      this.prisma.system.paperBook.findMany(),
      this.prisma.system.paperChapter.findMany(),
      this.prisma.system.paperSubTopic.findMany(),
    ]);
    return toPaperCatalog({ boards, classes, books, chapters, subTopics });
  }

  /** getQuestionBank: teachers (to build papers) or anyone who can print (to review them). */
  async getQuestionBank() {
    const ctx = currentContext();
    if (ctx.role !== "teacher" && !(await this.canPrint())) throw fail(403, "You don't have access to the question bank");
    return (await this.prisma.system.bankQuestion.findMany()).map(toBankQuestion);
  }

  /** getPapers: a teacher's own papers, plus every non-draft paper if they can print; everyone else (no staffId) sees all. */
  async list() {
    const ctx = currentContext();
    const canPrint = await this.canPrint();
    const rows = await this.prisma.tenant.paper.findMany({ orderBy: { updatedAt: "desc" } });
    const visible = !ctx.staffId ? rows : rows.filter((p) => p.teacherId === ctx.staffId || (canPrint && p.status !== "draft"));
    return visible.map(toPaper);
  }

  private async ownedPaper(id: string) {
    const ctx = currentContext();
    const paper = await this.prisma.tenant.paper.findFirst({ where: { id } });
    if (!paper) throw fail(404, "Paper not found");
    if (ctx.staffId && ctx.staffId !== paper.teacherId) throw fail(403, "Only the teacher who made this paper can change it");
    return paper;
  }

  /** savePaperDraft: creates a draft, or saves an existing draft or returned paper. The caller's own staffId always wins over whatever teacherId is sent. */
  async saveDraft(body: SaveDraftDto) {
    const ctx = currentContext();
    const teacherId = ctx.staffId ?? body.teacherId;
    const existing = body.id ? await this.ownedPaper(body.id) : null;
    if (existing && existing.status !== "draft" && existing.status !== "returned") throw fail(409, "This paper has been submitted and can't be changed");

    const data = {
      branchId: body.branchId,
      boardId: body.boardId,
      classId: body.classId,
      bookId: body.bookId,
      subTopicIds: body.subTopicIds,
      blueprint: body.blueprint as unknown as Prisma.InputJsonValue,
      questions: body.questions as unknown as Prisma.InputJsonValue,
      details: body.details as unknown as Prisma.InputJsonValue,
      step: body.step,
      updatedAt: new Date(),
    };
    const saved = existing
      ? await this.prisma.tenant.paper.update({ where: { id: existing.id }, data })
      : await (async () => {
          const member = await this.prisma.tenant.staffMember.findFirst({ where: { staffId: teacherId } });
          const at = new Date();
          return this.prisma.tenant.paper.create({
            data: {
              ...data,
              tenantId: requireTenantId(),
              teacherId,
              teacherName: member?.name ?? teacherId,
              createdAt: at,
              history: [{ at: at.toISOString(), by: actorName(), action: "created" }] as unknown as Prisma.InputJsonValue,
            },
          });
        })();
    await this.audit.record("paper.saved", "paper", saved.id);
    return toPaper(saved);
  }

  /** submitPaper: draft or returned → submitted, after checking the paper is complete. */
  async submit(id: string) {
    const paper = await this.ownedPaper(id);
    if (paper.status !== "draft" && paper.status !== "returned") throw fail(409, "This paper is already submitted");
    const problem = paperProblem({
      boardId: paper.boardId,
      classId: paper.classId,
      bookId: paper.bookId,
      subTopicIds: paper.subTopicIds,
      questions: paper.questions as { text: string; marks: number; type: "mcq" | "short" | "long"; options?: string[] }[],
      details: paper.details as { examName: string; date: string; timeAllowed: string },
    });
    if (problem) throw fail(400, problem);
    const at = new Date();
    const history = [...(paper.history as unknown[]), { at: at.toISOString(), by: actorName(), action: "submitted" }];
    const saved = await this.prisma.tenant.paper.update({
      where: { id },
      data: { status: "submitted", step: 6, submittedAt: at, updatedAt: at, history: history as unknown as Prisma.InputJsonValue },
    });
    await this.audit.record("paper.submitted", "paper", id);
    return toPaper(saved);
  }

  /** markPaperPrinted: submitted → printed. */
  async markPrinted(id: string) {
    if (!(await this.canPrint())) throw fail(403, "You don't have permission to print papers");
    const paper = await this.prisma.tenant.paper.findFirst({ where: { id } });
    if (!paper) throw fail(404, "Paper not found");
    if (paper.status !== "submitted") throw fail(409, "Only a submitted paper can be marked printed");
    const at = new Date();
    const history = [...(paper.history as unknown[]), { at: at.toISOString(), by: actorName(), action: "printed" }];
    const saved = await this.prisma.tenant.paper.update({ where: { id }, data: { status: "printed", printedAt: at, updatedAt: at, history: history as unknown as Prisma.InputJsonValue } });
    await this.audit.record("paper.printed", "paper", id);
    return toPaper(saved);
  }

  /** returnPaper: submitted → returned, with a note for the teacher. */
  async returnToTeacher(id: string, note: string) {
    if (!(await this.canPrint())) throw fail(403, "You don't have permission to return papers");
    const paper = await this.prisma.tenant.paper.findFirst({ where: { id } });
    if (!paper) throw fail(404, "Paper not found");
    if (paper.status !== "submitted") throw fail(409, "Only a submitted paper can be returned");
    const trimmed = note.trim();
    if (trimmed.length < 5) throw fail(400, "Tell the teacher what to change");
    const at = new Date();
    const history = [...(paper.history as unknown[]), { at: at.toISOString(), by: actorName(), action: "returned", note: trimmed }];
    const saved = await this.prisma.tenant.paper.update({ where: { id }, data: { status: "returned", returnNote: trimmed, updatedAt: at, history: history as unknown as Prisma.InputJsonValue } });
    await this.audit.record("paper.returned", "paper", id);
    return toPaper(saved);
  }

  /** getPrintablePaper: the printable paper or answer key. */
  async getPrintable(id: string) {
    if (!(await this.canPrint())) throw fail(403, "You don't have permission to print papers");
    const paper = await this.prisma.tenant.paper.findFirst({ where: { id } });
    if (!paper) throw fail(404, "Paper not found");
    if (paper.status !== "submitted" && paper.status !== "printed") throw fail(409, "Only submitted papers can be printed");
    return toPaper(paper);
  }
}
