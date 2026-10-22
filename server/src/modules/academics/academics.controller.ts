import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { AcademicsService } from "./academics.service";
import { AddClassDto } from "./dto/class.dto";
import { AddSectionDto, UpdateSectionDto } from "./dto/section.dto";
import { AddSubjectDto } from "./dto/subject.dto";
import { SetClassSubjectDto } from "./dto/class-subject.dto";

/** Classes, sections, subjects and the subjects a class offers. All gated behind the Students module. */
@ApiTags("academics")
@RequireModule("students")
@Controller()
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  /** getClasses */
  @Get("classes")
  listClasses() {
    return this.academics.listClasses();
  }

  /** addClass */
  @RequirePermission("adm_edit_student")
  @Post("classes")
  addClass(@Body() body: AddClassDto) {
    return this.academics.addClass(body);
  }

  /** removeClass */
  @RequirePermission("adm_edit_student")
  @Delete("classes/:id")
  removeClass(@Param("id") id: string) {
    return this.academics.removeClass(id);
  }

  /** getSections */
  @Get("sections")
  listSections() {
    return this.academics.listSections();
  }

  /** addSection */
  @RequirePermission("adm_edit_student")
  @Post("sections")
  addSection(@Body() body: AddSectionDto) {
    return this.academics.addSection(body);
  }

  /** updateSection */
  @RequirePermission("adm_edit_student")
  @Patch("sections/:id")
  updateSection(@Param("id") id: string, @Body() body: UpdateSectionDto) {
    return this.academics.updateSection(id, body);
  }

  /** removeSection */
  @RequirePermission("adm_edit_student")
  @Delete("sections/:id")
  removeSection(@Param("id") id: string) {
    return this.academics.removeSection(id);
  }

  /** getSubjects */
  @Get("subjects")
  listSubjects() {
    return this.academics.listSubjects();
  }

  /** addSubject */
  @RequirePermission("adm_edit_student")
  @Post("subjects")
  addSubject(@Body() body: AddSubjectDto) {
    return this.academics.addSubject(body);
  }

  /** removeSubject */
  @RequirePermission("adm_edit_student")
  @Delete("subjects/:id")
  removeSubject(@Param("id") id: string) {
    return this.academics.removeSubject(id);
  }

  /** getClassSubjects */
  @Get("class-subjects")
  listClassSubjects() {
    return this.academics.listClassSubjects();
  }

  /** setClassSubject */
  @RequirePermission("adm_edit_student")
  @Put("class-subjects")
  setClassSubject(@Body() body: SetClassSubjectDto) {
    return this.academics.setClassSubject(body);
  }
}
