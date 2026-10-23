import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { actorName, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, toExam, toExamMark, toExamPaper } from "../../common/shapes";
import type { SaveDateSheetDto } from "./dto/paper.dto";
import type { SaveExamDto } from "./dto/save-exam.dto";
import type { SaveMarksDto } from "./dto/marks.dto";

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getExams */
  async list() {
    return (await this.prisma.tenant.exam.findMany({ orderBy: { startDate: "desc" } })).map(toExam);
  }

  /** getExamPapers */
  async listPapers() {
    return (await this.prisma.tenant.examPaper.findMany()).map(toExamPaper);
  }

  /** getExamMarks */
  async listMarks() {
    return (await this.prisma.tenant.examMark.findMany()).map(toExamMark);
  }

  /** saveExam: adds an exam or updates one; editing or deleting is blocked once results are published. */
  async saveExam(body: SaveExamDto) {
    const title = body.title.trim();
    if (title.length < 3) throw fail(400, "Enter the exam name");
    if (body.endDate < body.startDate) throw fail(400, "The end date must be on or after the start date");

    const existing = body.id ? await this.prisma.tenant.exam.findFirst({ where: { id: body.id } }) : null;
    if (body.id && !existing) throw fail(404, "Exam not found");
    if (existing?.publishedAt) throw fail(409, "Results are published; unpublish them to change this exam");
    if (await this.prisma.tenant.exam.findFirst({ where: { id: { not: body.id }, branchId: body.branchId, title: { equals: title, mode: "insensitive" } } }))
      throw fail(409, "An exam with this name already exists");

    const startDate = parseDay(body.startDate);
    const endDate = parseDay(body.endDate);
    const dropped = existing ? existing.classIds.filter((c) => !body.classIds.includes(c)) : [];
    if (dropped.length) {
      const droppedStudents = await this.prisma.tenant.student.findMany({ where: { classId: { in: dropped } }, select: { id: true } });
      const droppedMarks = await this.prisma.tenant.examMark.count({ where: { examId: existing!.id, studentId: { in: droppedStudents.map((s) => s.id) } } });
      if (droppedMarks > 0) throw fail(409, "Marks are entered for a class you removed; keep that class or delete its marks first");
    }
    if (existing) {
      const outside = await this.prisma.tenant.examPaper.count({
        where: { examId: existing.id, classId: { in: body.classIds }, OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }] },
      });
      if (outside > 0) throw fail(409, `${outside} date sheet papers fall outside the new dates; move them first`);
    }

    const data = { branchId: body.branchId, sessionId: body.sessionId, title, termType: body.termType, startDate, endDate, classIds: body.classIds };
    const saved = await this.prisma.tx(async (tx) => {
      if (dropped.length) await tx.examPaper.deleteMany({ where: { examId: existing!.id, classId: { in: dropped } } });
      return existing
        ? tx.exam.update({ where: { id: existing.id }, data })
        : tx.exam.create({ data: { ...data, tenantId: requireTenantId(), createdBy: actorName() } });
    });
    await this.audit.record("exam.saved", "exam", saved.id, { title });
    return toExam(saved);
  }

  /** deleteExam: removes an exam with its date sheet and marks. */
  async deleteExam(id: string) {
    const exam = await this.prisma.tenant.exam.findFirst({ where: { id } });
    if (!exam) throw fail(404, "Exam not found");
    if (exam.publishedAt) throw fail(409, "Results are published; unpublish them before deleting");
    await this.prisma.tenant.exam.delete({ where: { id } });
    await this.audit.record("exam.deleted", "exam", id);
    return null;
  }

  /** saveDateSheet: replaces one class's date sheet for an exam. */
  async saveDateSheet(examId: string, body: SaveDateSheetDto) {
    const exam = await this.prisma.tenant.exam.findFirst({ where: { id: examId } });
    if (!exam) throw fail(404, "Exam not found");
    if (exam.publishedAt) throw fail(409, "Results are published; the date sheet can't change");

    const subjects = await this.prisma.tenant.subject.findMany({ where: { id: { in: body.papers.map((p) => p.subjectId) } } });
    const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "a subject";

    for (const p of body.papers) {
      const date = parseDay(p.date);
      if (date < exam.startDate || date > exam.endDate) throw fail(400, `${subjectName(p.subjectId)}: the date must fall within the exam dates`);
      if (p.passMarks > p.totalMarks) throw fail(400, `${subjectName(p.subjectId)}: pass marks can't be more than the total`);
      const students = await this.prisma.tenant.student.findMany({ where: { classId: body.classId }, select: { id: true } });
      const top = await this.prisma.tenant.examMark.aggregate({
        where: { examId, subjectId: p.subjectId, studentId: { in: students.map((s) => s.id) } },
        _max: { obtained: true },
      });
      if ((top._max.obtained ?? 0) > p.totalMarks) throw fail(409, `${subjectName(p.subjectId)}: a student already has ${top._max.obtained} marks, more than the new total`);
    }

    const kept = new Set(body.papers.map((p) => p.subjectId));
    const classStudents = await this.prisma.tenant.student.findMany({ where: { classId: body.classId }, select: { id: true } });
    const marked = await this.prisma.tenant.examMark.findFirst({
      where: { examId, subjectId: { notIn: [...kept] }, studentId: { in: classStudents.map((s) => s.id) } },
    });
    if (marked) throw fail(409, `${subjectName(marked.subjectId)} already has marks, so it can't be taken off the date sheet`);

    const tenantId = requireTenantId();
    const saved = await this.prisma.tx(async (tx) => {
      await tx.examPaper.deleteMany({ where: { examId, classId: body.classId } });
      await tx.examPaper.createMany({
        data: body.papers.map((p) => ({ tenantId, examId, classId: body.classId, subjectId: p.subjectId, date: parseDay(p.date), totalMarks: p.totalMarks, passMarks: p.passMarks })),
      });
      return tx.examPaper.findMany({ where: { examId, classId: body.classId } });
    });
    return saved.map(toExamPaper);
  }

  /** saveMarks: saves marks for one paper; entries not sent are left alone. */
  async saveMarks(body: SaveMarksDto) {
    const exam = await this.prisma.tenant.exam.findFirst({ where: { id: body.examId } });
    if (!exam) throw fail(404, "Exam not found");
    if (exam.publishedAt) throw fail(409, "Results are published; marks are locked");

    const tenantId = requireTenantId();
    const at = new Date();
    const by = actorName();
    const saved = await this.prisma.tx(async (tx) => {
      const out = [];
      for (const e of body.entries) {
        const student = await tx.student.findFirst({ where: { id: e.studentId } });
        const paper = student ? await tx.examPaper.findFirst({ where: { examId: body.examId, subjectId: body.subjectId, classId: student.classId } }) : null;
        if (!student || !paper) throw fail(400, "This subject isn't on the date sheet for that class");
        if (e.obtained !== null && (e.obtained < 0 || e.obtained > paper.totalMarks || Math.round(e.obtained * 2) !== e.obtained * 2))
          throw fail(400, `${student.name}: marks should be between 0 and ${paper.totalMarks}, in half marks`);
        const mark = await tx.examMark.upsert({
          where: { tenantId_examId_subjectId_studentId: { tenantId, examId: body.examId, subjectId: body.subjectId, studentId: e.studentId } },
          create: { tenantId, examId: body.examId, subjectId: body.subjectId, studentId: e.studentId, obtained: e.absent ? null : e.obtained, absent: e.absent, remark: e.remark?.trim() || null, updatedAt: at, updatedBy: by },
          update: { obtained: e.absent ? null : e.obtained, absent: e.absent, remark: e.remark?.trim() || null, updatedAt: at, updatedBy: by },
        });
        out.push(mark);
      }
      return out;
    });
    return saved.map(toExamMark);
  }

  /** setResultsPublished: publishing locks the exam and its marks; unpublishing reopens them. */
  async setResultsPublished(examId: string, published: boolean) {
    const exam = await this.prisma.tenant.exam.findFirst({ where: { id: examId } });
    if (!exam) throw fail(404, "Exam not found");
    await this.prisma.tenant.exam.update({ where: { id: examId }, data: { publishedAt: published ? new Date() : null } });
    await this.audit.record(published ? "exam.published" : "exam.unpublished", "exam", examId);
    return null;
  }
}
