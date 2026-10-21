import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { admissionNumber, checkPlacement, guardianProblem, placementText, rollId, seatProblem } from "../../domain/students";
import { AuditService } from "../../common/audit.service";
import { actorName, requireTenantId } from "../../common/context";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { initialsOf, parseDay, toStudent, toStudentActivity, todayInSchool } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";

const GENDERS = ["male", "female", "other"] as const;
const RELATIONS = ["father", "mother", "guardian", "grandparent", "sibling"] as const;
const DOC_KINDS = ["b_form", "photo", "leaving_certificate", "result_card", "other"] as const;
const WITHDRAW_REASONS = ["transferred", "relocated", "fees", "completed", "disciplinary", "other"] as const;

class GuardianDto {
  /** Present when editing an existing guardian; ignored on admission. */
  @IsOptional() @IsString() id?: string;
  @IsString() @Length(1, 80) name!: string;
  @IsIn(RELATIONS) relation!: (typeof RELATIONS)[number];
  @IsOptional() @IsString() cnic?: string;
  @IsString() @Length(1, 20) phone!: string;
  @IsBoolean() whatsapp!: boolean;
  @IsBoolean() primary!: boolean;
  @IsOptional() @IsString() occupation?: string;
}

class AdmissionDto {
  @IsISO8601({ strict: true }) admissionDate!: string;
  @IsString() @Length(1, 120) name!: string;
  @IsEmail({}, { message: "Enter a valid email address" }) email!: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() bForm?: string;
  @IsISO8601({ strict: true }) dateOfBirth!: string;
  @IsIn(GENDERS) gender!: (typeof GENDERS)[number];
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() religion?: string;
  @IsString() @Length(1, 240) address!: string;
  @IsOptional() @IsString() previousSchool?: string;
  @IsString() branchId!: string;
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsArray() @IsString({ each: true }) electiveSubjectIds!: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => GuardianDto) guardians!: GuardianDto[];
  @IsInt() @Min(0) monthlyFee!: number;
  @IsInt() @Min(0) @Max(100) discountPercent!: number;
  @IsOptional() @IsArray() @IsString({ each: true }) siblingIds?: string[];
}

class UpdateStudentDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsEmail({}, { message: "Enter a valid email address" }) email?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() bForm?: string;
  @IsOptional() @IsISO8601({ strict: true }) dateOfBirth?: string;
  @IsOptional() @IsIn(GENDERS) gender?: (typeof GENDERS)[number];
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() @Length(1, 240) address?: string;
  @IsOptional() @IsString() previousSchool?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) electiveSubjectIds?: string[];
  @IsOptional() @IsInt() @Min(0) monthlyFee?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;
}

class ChangeSectionDto {
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) ids!: string[];
  @IsString() classId!: string;
  @IsString() sectionId!: string;
}

class TransferStudentDto {
  @IsString() branchId!: string;
  @IsString() classId!: string;
  @IsString() sectionId!: string;
}

class SetElectivesDto {
  @IsArray() @IsString({ each: true }) subjectIds!: string[];
}

class WithdrawDto {
  @IsISO8601({ strict: true }) date!: string;
  @IsIn(WITHDRAW_REASONS) reason!: (typeof WITHDRAW_REASONS)[number];
  @IsOptional() @IsString() note?: string;
}

class ReadmitDto {
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsISO8601({ strict: true }) date!: string;
}

class UpdateGuardiansDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => GuardianDto) guardians!: GuardianDto[];
}

class AddDocumentDto {
  @IsString() @Length(1, 120) name!: string;
  @IsIn(DOC_KINDS) kind!: (typeof DOC_KINDS)[number];
  @IsString() @Length(1, 255) fileName!: string;
  @IsInt() @Min(0) sizeKb!: number;
}

const guardianFields = (g: GuardianDto) => ({
  name: g.name.trim(),
  relation: g.relation,
  cnic: g.cnic,
  phone: g.phone,
  whatsapp: g.whatsapp,
  primary: g.primary,
  occupation: g.occupation,
});
/** For nested creation under student.create({ guardians: { create: [...] } }); studentId is implied by the relation. */
const guardianCreateData = (tenantId: string, g: GuardianDto) => ({ tenantId, ...guardianFields(g) });
/** For a standalone guardian row (updateGuardians), where studentId must be given explicitly. */
const guardianStandaloneData = (tenantId: string, studentId: string, g: GuardianDto) => ({ tenantId, studentId, ...guardianFields(g) });

/** Admission, directory, section moves, transfers, electives, withdrawal and documents. Gated behind the Students module. */
@ApiTags("students")
@RequireModule("students")
@Controller("students")
export class StudentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private full(studentId: string, tx: Prisma.TransactionClient | PrismaService["tenant"] = this.prisma.tenant) {
    return tx.student.findUniqueOrThrow({ where: { id: studentId }, include: { guardians: true, documents: true } });
  }

  /** getStudents */
  @Get()
  async list() {
    const rows = await this.prisma.tenant.student.findMany({ include: { guardians: true, documents: true }, orderBy: { id: "asc" } });
    return rows.map((s) => toStudent(s, s.guardians, s.documents));
  }

  /** getStudentActivity: every school's activity log, newest first. */
  @Get("activity")
  async activity() {
    const rows = await this.prisma.tenant.studentActivity.findMany({ orderBy: { at: "desc" } });
    return rows.map(toStudentActivity);
  }

  /** admitStudent */
  @RequirePermission("adm_admit_student")
  @Post()
  async admit(@Body() body: AdmissionDto) {
    const tenantId = requireTenantId();
    const org = await this.prisma.tenant.organization.findUniqueOrThrow({ where: { id: tenantId } });
    const activeCount = await this.prisma.tenant.student.count({ where: { enrollment: "active" } });
    const seats = seatProblem(org.studentSeats, activeCount, 1);
    if (seats) throw fail(409, seats);

    const cls = await this.prisma.tenant.schoolClass.findFirst({ where: { id: body.classId } });
    const section = await this.prisma.tenant.section.findFirst({ where: { id: body.sectionId } });
    const problem = checkPlacement(cls, section, body.classId, body.branchId);
    if (problem) throw fail(400, problem);

    if (body.bForm && (await this.prisma.tenant.student.findFirst({ where: { bForm: body.bForm } })))
      throw fail(409, `A student with B-form ${body.bForm} is already enrolled`);

    const created = await this.prisma.tx(async (tx) => {
      const year = body.admissionDate.slice(0, 4);
      const [roll, seq] = await Promise.all([
        tx.counter.upsert({ where: { tenantId_key: { tenantId, key: "student_roll" } }, create: { tenantId, key: "student_roll", value: 1 }, update: { value: { increment: 1 } } }),
        tx.counter.upsert({ where: { tenantId_key: { tenantId, key: `admission_${year}` } }, create: { tenantId, key: `admission_${year}`, value: 1 }, update: { value: { increment: 1 } } }),
      ]);
      const id = rollId(roll.value);
      const student = await tx.student.create({
        data: {
          id,
          tenantId,
          admissionNo: admissionNumber(year, seq.value),
          admissionDate: parseDay(body.admissionDate),
          name: body.name.trim(),
          email: body.email.trim(),
          avatar: initialsOf(body.name),
          photoUrl: body.photoUrl,
          bForm: body.bForm,
          dateOfBirth: parseDay(body.dateOfBirth),
          gender: body.gender,
          bloodGroup: body.bloodGroup,
          religion: body.religion,
          address: body.address.trim(),
          previousSchool: body.previousSchool,
          branchId: body.branchId,
          classId: body.classId,
          sectionId: body.sectionId,
          electiveSubjectIds: body.electiveSubjectIds,
          siblingIds: body.siblingIds ?? [],
          monthlyFee: body.monthlyFee,
          discountPercent: body.discountPercent,
          enrollment: "active",
          feeStatus: "clear",
          attendance: 100,
          balance: 0,
          guardians: { create: body.guardians.map((g) => guardianCreateData(tenantId, g)) },
        },
        include: { guardians: true, documents: true },
      });
      for (const sibId of student.siblingIds) {
        const sibling = await tx.student.findFirst({ where: { id: sibId } });
        if (sibling && !sibling.siblingIds.includes(student.id)) await tx.student.update({ where: { id: sibId }, data: { siblingIds: { push: student.id } } });
      }
      await tx.studentActivity.create({ data: { tenantId, studentId: student.id, actor: actorName(), text: `Admitted to ${placementText(cls, section)}.` } });
      return student;
    });

    await this.audit.record("student.admitted", "student", created.id, { name: created.name });
    return toStudent(created, created.guardians, created.documents);
  }

  /** importStudents: a spreadsheet of admissions in one go; siblings are linked by a shared guardian phone. */
  @RequirePermission("adm_admit_student")
  @Post("import")
  async import(@Body(new ParseArrayPipe({ items: AdmissionDto })) body: AdmissionDto[]) {
    const tenantId = requireTenantId();
    const org = await this.prisma.tenant.organization.findUniqueOrThrow({ where: { id: tenantId } });
    const activeCount = await this.prisma.tenant.student.count({ where: { enrollment: "active" } });
    const seats = seatProblem(org.studentSeats, activeCount, body.length);
    if (seats) throw fail(409, seats);

    const created = await this.prisma.tx(async (tx) => {
      const rows: Awaited<ReturnType<typeof this.full>>[] = [];
      for (const input of body) {
        const cls = await tx.schoolClass.findFirst({ where: { id: input.classId } });
        const section = await tx.section.findFirst({ where: { id: input.sectionId } });
        const year = input.admissionDate.slice(0, 4);
        const [roll, seq] = await Promise.all([
          tx.counter.upsert({ where: { tenantId_key: { tenantId, key: "student_roll" } }, create: { tenantId, key: "student_roll", value: 1 }, update: { value: { increment: 1 } } }),
          tx.counter.upsert({ where: { tenantId_key: { tenantId, key: `admission_${year}` } }, create: { tenantId, key: `admission_${year}`, value: 1 }, update: { value: { increment: 1 } } }),
        ]);
        const id = rollId(roll.value);
        const student = await tx.student.create({
          data: {
            id,
            tenantId,
            admissionNo: admissionNumber(year, seq.value),
            admissionDate: parseDay(input.admissionDate),
            name: input.name.trim(),
            email: input.email.trim(),
            avatar: initialsOf(input.name),
            photoUrl: input.photoUrl,
            bForm: input.bForm,
            dateOfBirth: parseDay(input.dateOfBirth),
            gender: input.gender,
            bloodGroup: input.bloodGroup,
            religion: input.religion,
            address: input.address.trim(),
            previousSchool: input.previousSchool,
            branchId: input.branchId,
            classId: input.classId,
            sectionId: input.sectionId,
            electiveSubjectIds: input.electiveSubjectIds,
            siblingIds: input.siblingIds ?? [],
            monthlyFee: input.monthlyFee,
            discountPercent: input.discountPercent,
            enrollment: "active",
            feeStatus: "clear",
            attendance: 100,
            balance: 0,
            guardians: { create: input.guardians.map((g) => guardianCreateData(tenantId, g)) },
          },
          include: { guardians: true, documents: true },
        });
        await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Admitted to ${placementText(cls, section)} by spreadsheet import.` } });
        rows.push(student);
      }
      // Link siblings: students (new or existing) who share a guardian phone number, both ways.
      for (const s of rows) {
        const phones = s.guardians.map((g) => g.phone);
        const siblings = await tx.student.findMany({ where: { id: { not: s.id }, guardians: { some: { phone: { in: phones } } } } });
        const siblingIds = [...new Set([...s.siblingIds, ...siblings.map((o) => o.id)])];
        if (siblingIds.length !== s.siblingIds.length) await tx.student.update({ where: { id: s.id }, data: { siblingIds } });
        for (const sib of siblings) {
          if (!sib.siblingIds.includes(s.id)) await tx.student.update({ where: { id: sib.id }, data: { siblingIds: { push: s.id } } });
        }
      }
      return Promise.all(rows.map((r) => this.full(r.id, tx)));
    });

    await this.audit.record("student.imported", "student", undefined, { count: created.length });
    return created.map((s) => toStudent(s, s.guardians, s.documents));
  }

  /** updateStudent: profile fields. Guardians, documents, enrollment and fee standing go through their own endpoints. */
  @RequirePermission("adm_edit_student")
  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: UpdateStudentDto) {
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    if (body.bForm && (await this.prisma.tenant.student.findFirst({ where: { id: { not: id }, bForm: body.bForm } })))
      throw fail(409, `B-form ${body.bForm} belongs to another student`);
    const updated = await this.prisma.tenant.student.update({
      where: { id },
      data: {
        ...body,
        admissionDate: undefined,
        dateOfBirth: body.dateOfBirth ? parseDay(body.dateOfBirth) : undefined,
        avatar: body.name ? initialsOf(body.name) : undefined,
      },
      include: { guardians: true, documents: true },
    });
    await this.audit.record("student.updated", "student", id, { fields: Object.keys(body) });
    await this.prisma.tenant.studentActivity.create({ data: { tenantId: requireTenantId(), studentId: id, actor: actorName(), text: "Details updated." } });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** changeSection: moves one or more students to another section (and class) at the same campus. */
  @RequirePermission("adm_edit_student")
  @Post("change-section")
  async changeSection(@Body() body: ChangeSectionDto) {
    const tenantId = requireTenantId();
    const cls = await this.prisma.tenant.schoolClass.findFirst({ where: { id: body.classId } });
    const section = await this.prisma.tenant.section.findFirst({ where: { id: body.sectionId } });
    const problem = checkPlacement(cls, section, body.classId);
    if (problem) throw fail(400, problem);
    const where = placementText(cls, section);
    await this.prisma.tx(async (tx) => {
      for (const id of body.ids) {
        const student = await tx.student.findFirst({ where: { id } });
        if (!student || (student.classId === body.classId && student.sectionId === body.sectionId)) continue;
        const electiveSubjectIds = student.classId === body.classId ? student.electiveSubjectIds : [];
        await tx.student.update({ where: { id }, data: { classId: body.classId, sectionId: body.sectionId, electiveSubjectIds } });
        await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Moved to ${where}.` } });
      }
    });
    return null;
  }

  /** transferStudent: to another campus. */
  @RequirePermission("adm_edit_student")
  @Post(":id/transfer")
  async transfer(@Param("id") id: string, @Body() body: TransferStudentDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    if (body.branchId === student.branchId) throw fail(400, "Choose a different campus");
    const cls = await this.prisma.tenant.schoolClass.findFirst({ where: { id: body.classId } });
    const section = await this.prisma.tenant.section.findFirst({ where: { id: body.sectionId } });
    const problem = checkPlacement(cls, section, body.classId, body.branchId);
    if (problem) throw fail(400, problem);
    const branch = await this.prisma.tenant.branch.findFirst({ where: { id: body.branchId } });
    const updated = await this.prisma.tx(async (tx) => {
      const row = await tx.student.update({
        where: { id },
        data: { branchId: body.branchId, classId: body.classId, sectionId: body.sectionId, electiveSubjectIds: [] },
        include: { guardians: true, documents: true },
      });
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Transferred to ${branch?.name ?? "another campus"}, ${placementText(cls, section)}.` } });
      return row;
    });
    await this.audit.record("student.transferred", "student", id, { branchId: body.branchId });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** setElectives */
  @RequirePermission("adm_edit_student")
  @Put(":id/electives")
  async setElectives(@Param("id") id: string, @Body() body: SetElectivesDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    const updated = await this.prisma.tx(async (tx) => {
      const row = await tx.student.update({ where: { id }, data: { electiveSubjectIds: body.subjectIds }, include: { guardians: true, documents: true } });
      const names = (await tx.subject.findMany({ where: { id: { in: body.subjectIds } } })).map((s) => s.name);
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: names.length ? `Electives set to ${names.join(", ")}.` : "Electives cleared." } });
      return row;
    });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** withdrawStudent */
  @RequirePermission("adm_edit_student")
  @Post(":id/withdraw")
  async withdraw(@Param("id") id: string, @Body() body: WithdrawDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    if (student.enrollment === "withdrawn") throw fail(409, "This student has already left");
    const updated = await this.prisma.tx(async (tx) => {
      const row = await tx.student.update({
        where: { id },
        data: { enrollment: "withdrawn", withdrawal: { date: body.date, reason: body.reason, note: body.note } },
        include: { guardians: true, documents: true },
      });
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Marked as left${body.note ? `: ${body.note}` : "."}` } });
      return row;
    });
    await this.audit.record("student.withdrawn", "student", id, { reason: body.reason });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** readmitStudent */
  @RequirePermission("adm_admit_student")
  @Post(":id/readmit")
  async readmit(@Param("id") id: string, @Body() body: ReadmitDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    if (student.enrollment === "active") throw fail(409, "This student is already enrolled");
    const cls = await this.prisma.tenant.schoolClass.findFirst({ where: { id: body.classId } });
    const section = await this.prisma.tenant.section.findFirst({ where: { id: body.sectionId } });
    const problem = checkPlacement(cls, section, body.classId, student.branchId);
    if (problem) throw fail(400, problem);
    const updated = await this.prisma.tx(async (tx) => {
      const row = await tx.student.update({
        where: { id },
        data: { enrollment: "active", classId: body.classId, sectionId: body.sectionId, electiveSubjectIds: [], withdrawal: Prisma.JsonNull },
        include: { guardians: true, documents: true },
      });
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Re-admitted on ${body.date} to ${placementText(cls, section)}.` } });
      return row;
    });
    await this.audit.record("student.readmitted", "student", id);
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** updateGuardians: at least one guardian, exactly one marked primary. */
  @RequirePermission("adm_edit_student")
  @Put(":id/guardians")
  async updateGuardians(@Param("id") id: string, @Body() body: UpdateGuardiansDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    const problem = guardianProblem(body.guardians);
    if (problem) throw fail(400, problem);
    const updated = await this.prisma.tx(async (tx) => {
      const existing = await tx.guardian.findMany({ where: { studentId: id } });
      const existingIds = new Set(existing.map((g) => g.id));
      const keep = new Set(body.guardians.filter((g) => g.id && existingIds.has(g.id)).map((g) => g.id!));
      await tx.guardian.deleteMany({ where: { studentId: id, id: { notIn: [...keep] } } });
      for (const g of body.guardians) {
        if (g.id && keep.has(g.id)) await tx.guardian.update({ where: { id: g.id }, data: guardianFields(g) });
        else await tx.guardian.create({ data: guardianStandaloneData(tenantId, id, g) });
      }
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: "Guardians updated." } });
      return this.full(id, tx);
    });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** addStudentDocument: metadata only for now; file bytes aren't stored until object storage is set up. */
  @RequirePermission("adm_edit_student")
  @Post(":id/documents")
  async addDocument(@Param("id") id: string, @Body() body: AddDocumentDto) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    const updated = await this.prisma.tx(async (tx) => {
      await tx.studentDocument.create({ data: { tenantId, studentId: id, name: body.name, kind: body.kind, fileName: body.fileName, sizeKb: body.sizeKb, uploadedAt: parseDay(todayInSchool()) } });
      await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Document added: ${body.name}.` } });
      return this.full(id, tx);
    });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** removeStudentDocument */
  @RequirePermission("adm_edit_student")
  @Delete(":id/documents/:documentId")
  async removeDocument(@Param("id") id: string, @Param("documentId") documentId: string) {
    const tenantId = requireTenantId();
    const student = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!student) throw fail(404, "Student not found");
    const updated = await this.prisma.tx(async (tx) => {
      const doc = await tx.studentDocument.findFirst({ where: { id: documentId, studentId: id } });
      await tx.studentDocument.deleteMany({ where: { id: documentId, studentId: id } });
      if (doc) await tx.studentActivity.create({ data: { tenantId, studentId: id, actor: actorName(), text: `Document removed: ${doc.name}.` } });
      return this.full(id, tx);
    });
    return toStudent(updated, updated.guardians, updated.documents);
  }

  /** deleteStudent: for records entered by mistake; use withdraw otherwise. */
  @RequirePermission("adm_edit_student")
  @Delete(":id")
  async remove(@Param("id") id: string) {
    const exists = await this.prisma.tenant.student.findFirst({ where: { id } });
    if (!exists) throw fail(404, "Student not found");
    await this.prisma.tx(async (tx) => {
      const siblings = await tx.student.findMany({ where: { siblingIds: { has: id } } });
      for (const s of siblings) await tx.student.update({ where: { id: s.id }, data: { siblingIds: s.siblingIds.filter((x) => x !== id) } });
      await tx.student.delete({ where: { id } });
    });
    await this.audit.record("student.deleted", "student", id);
    return null;
  }
}
