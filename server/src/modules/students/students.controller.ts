import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { AdmissionDto } from "./dto/admission.dto";
import { ChangeSectionDto } from "./dto/change-section.dto";
import { ReadmitStudentDto } from "./dto/readmit-student.dto";
import { SetElectivesDto } from "./dto/set-electives.dto";
import { TransferStudentDto } from "./dto/transfer-student.dto";
import { UpdateGuardiansDto } from "./dto/update-guardians.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { WithdrawStudentDto } from "./dto/withdraw-student.dto";
import { AddDocumentDto } from "./dto/add-document.dto";
import { StudentsService } from "./students.service";

/** Admission, directory, section moves, transfers, electives, withdrawal and documents. Gated behind the Students module. */
@ApiTags("students")
@RequireModule("students")
@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  /** getStudents */
  @Get()
  list() {
    return this.students.list();
  }

  /** getStudentActivity: every school's activity log, newest first. */
  @Get("activity")
  activity() {
    return this.students.activity();
  }

  /** admitStudent */
  @RequirePermission("adm_admit_student")
  @Post()
  admit(@Body() body: AdmissionDto) {
    return this.students.admit(body);
  }

  /** importStudents: a spreadsheet of admissions in one go; siblings are linked by a shared guardian phone. */
  @RequirePermission("adm_admit_student")
  @Post("import")
  import(@Body(new ParseArrayPipe({ items: AdmissionDto })) body: AdmissionDto[]) {
    return this.students.import(body);
  }

  /** updateStudent: profile fields. Guardians, documents, enrollment and fee standing go through their own endpoints. */
  @RequirePermission("adm_edit_student")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateStudentDto) {
    return this.students.update(id, body);
  }

  /** changeSection: moves one or more students to another section (and class) at the same campus. */
  @RequirePermission("adm_edit_student")
  @Post("change-section")
  changeSection(@Body() body: ChangeSectionDto) {
    return this.students.changeSection(body);
  }

  /** transferStudent: to another campus. */
  @RequirePermission("adm_edit_student")
  @Post(":id/transfer")
  transfer(@Param("id") id: string, @Body() body: TransferStudentDto) {
    return this.students.transfer(id, body);
  }

  /** setElectives */
  @RequirePermission("adm_edit_student")
  @Put(":id/electives")
  setElectives(@Param("id") id: string, @Body() body: SetElectivesDto) {
    return this.students.setElectives(id, body);
  }

  /** withdrawStudent */
  @RequirePermission("adm_edit_student")
  @Post(":id/withdraw")
  withdraw(@Param("id") id: string, @Body() body: WithdrawStudentDto) {
    return this.students.withdraw(id, body);
  }

  /** readmitStudent */
  @RequirePermission("adm_admit_student")
  @Post(":id/readmit")
  readmit(@Param("id") id: string, @Body() body: ReadmitStudentDto) {
    return this.students.readmit(id, body);
  }

  /** updateGuardians: at least one guardian, exactly one marked primary. */
  @RequirePermission("adm_edit_student")
  @Put(":id/guardians")
  updateGuardians(@Param("id") id: string, @Body() body: UpdateGuardiansDto) {
    return this.students.updateGuardians(id, body);
  }

  /** addStudentDocument: metadata only for now; file bytes aren't stored until object storage is set up. */
  @RequirePermission("adm_edit_student")
  @Post(":id/documents")
  addDocument(@Param("id") id: string, @Body() body: AddDocumentDto) {
    return this.students.addDocument(id, body);
  }

  /** removeStudentDocument */
  @RequirePermission("adm_edit_student")
  @Delete(":id/documents/:documentId")
  removeDocument(@Param("id") id: string, @Param("documentId") documentId: string) {
    return this.students.removeDocument(id, documentId);
  }

  /** deleteStudent: for records entered by mistake; use withdraw otherwise. */
  @RequirePermission("adm_edit_student")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.students.remove(id);
  }
}
