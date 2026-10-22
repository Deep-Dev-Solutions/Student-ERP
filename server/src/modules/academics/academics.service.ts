import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AddClassDto } from "./dto/class.dto";
import type { AddSectionDto, UpdateSectionDto } from "./dto/section.dto";
import type { AddSubjectDto } from "./dto/subject.dto";
import type { SetClassSubjectDto } from "./dto/class-subject.dto";

const omit = <T extends { tenantId: string }>({ tenantId: _t, ...rest }: T) => rest;

/** Classes, sections, subjects and the subjects a class offers. */
@Injectable()
export class AcademicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getClasses */
  async listClasses() {
    const rows = await this.prisma.tenant.schoolClass.findMany({ orderBy: { order: "asc" } });
    return rows.map(omit);
  }

  /** addClass: class names are unique within a campus. */
  async addClass(body: AddClassDto) {
    const dup = await this.prisma.tenant.schoolClass.findFirst({ where: { branchId: body.branchId, name: { equals: body.name.trim(), mode: "insensitive" } } });
    if (dup) throw fail(409, `${body.name} already exists at this campus`);
    const created = await this.prisma.tenant.schoolClass.create({
      data: { tenantId: requireTenantId(), branchId: body.branchId, name: body.name.trim(), order: body.order, stage: body.stage },
    });
    await this.audit.record("class.added", "school_class", created.id, { name: created.name });
    return omit(created);
  }

  /** removeClass: a class's sections must be removed first. */
  async removeClass(id: string) {
    if (await this.prisma.tenant.section.findFirst({ where: { classId: id } })) throw fail(409, "Remove this class's sections first");
    await this.prisma.tx(async (tx) => {
      await tx.classSubject.deleteMany({ where: { classId: id } });
      await tx.schoolClass.deleteMany({ where: { id } });
    });
    await this.audit.record("class.removed", "school_class", id);
    return null;
  }

  /** getSections */
  async listSections() {
    const rows = await this.prisma.tenant.section.findMany({ orderBy: { name: "asc" } });
    return rows.map(omit);
  }

  /** addSection: section names are unique within a class. */
  async addSection(body: AddSectionDto) {
    const dup = await this.prisma.tenant.section.findFirst({ where: { classId: body.classId, name: { equals: body.name.trim(), mode: "insensitive" } } });
    if (dup) throw fail(409, `Section ${body.name} already exists in this class`);
    const created = await this.prisma.tenant.section.create({
      data: { tenantId: requireTenantId(), classId: body.classId, name: body.name.trim(), shift: body.shift, capacity: body.capacity, inchargeId: body.inchargeId },
    });
    await this.audit.record("section.added", "section", created.id, { name: created.name });
    return omit(created);
  }

  /** updateSection */
  async updateSection(id: string, body: UpdateSectionDto) {
    const section = await this.prisma.tenant.section.findFirst({ where: { id } });
    if (!section) throw fail(404, "Section not found");
    const updated = await this.prisma.tenant.section.update({ where: { id }, data: body });
    await this.audit.record("section.updated", "section", id);
    return omit(updated);
  }

  /** removeSection: matches the mock, no check for students currently placed there. */
  async removeSection(id: string) {
    await this.prisma.tenant.section.deleteMany({ where: { id } });
    await this.audit.record("section.removed", "section", id);
    return null;
  }

  /** getSubjects */
  async listSubjects() {
    const rows = await this.prisma.tenant.subject.findMany({ orderBy: { name: "asc" } });
    return rows.map(omit);
  }

  /** addSubject: a name or code can't repeat within the school. */
  async addSubject(body: AddSubjectDto) {
    const name = body.name.trim();
    const code = body.code.trim().toUpperCase();
    const dup = await this.prisma.tenant.subject.findFirst({ where: { OR: [{ name: { equals: name, mode: "insensitive" } }, { code }] } });
    if (dup) throw fail(409, "A subject with this name or code already exists");
    const created = await this.prisma.tenant.subject.create({ data: { tenantId: requireTenantId(), name, code } });
    await this.audit.record("subject.added", "subject", created.id, { name });
    return omit(created);
  }

  /** removeSubject */
  async removeSubject(id: string) {
    await this.prisma.tx(async (tx) => {
      await tx.classSubject.deleteMany({ where: { subjectId: id } });
      await tx.subject.deleteMany({ where: { id } });
    });
    await this.audit.record("subject.removed", "subject", id);
    return null;
  }

  /** getClassSubjects */
  async listClassSubjects() {
    const rows = await this.prisma.tenant.classSubject.findMany();
    return rows.map(omit);
  }

  /** setClassSubject: offers a subject in a class (core or elective), or stops offering it. */
  async setClassSubject(body: SetClassSubjectDto) {
    await this.prisma.tx(async (tx) => {
      await tx.classSubject.deleteMany({ where: { classId: body.classId, subjectId: body.subjectId } });
      if (body.offered) {
        await tx.classSubject.create({ data: { tenantId: requireTenantId(), classId: body.classId, subjectId: body.subjectId, elective: body.elective } });
      }
    });
    await this.audit.record("class_subject.set", "class_subject", `${body.classId}-${body.subjectId}`, body);
    return null;
  }
}
