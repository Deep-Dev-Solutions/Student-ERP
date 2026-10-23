import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { ExamsService } from "./exams.service";
import { SaveExamDto } from "./dto/save-exam.dto";
import { SaveDateSheetDto } from "./dto/paper.dto";
import { SaveMarksDto } from "./dto/marks.dto";
import { SetResultsPublishedDto } from "./dto/publish.dto";

/** Exams, date sheets, marks and published results. Gated behind the Exams module. */
@ApiTags("exams")
@RequireModule("exams")
@Controller()
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  /** getExams */
  @Get("exams")
  list() {
    return this.exams.list();
  }

  /** getExamPapers */
  @Get("exam-papers")
  listPapers() {
    return this.exams.listPapers();
  }

  /** getExamMarks */
  @Get("exam-marks")
  listMarks() {
    return this.exams.listMarks();
  }

  /** saveExam */
  @RequirePermission("acad_create_exam")
  @Put("exams")
  saveExam(@Body() body: SaveExamDto) {
    return this.exams.saveExam(body);
  }

  /** deleteExam */
  @RequirePermission("acad_create_exam")
  @Delete("exams/:id")
  deleteExam(@Param("id") id: string) {
    return this.exams.deleteExam(id);
  }

  /** saveDateSheet */
  @RequirePermission("acad_create_exam")
  @Put("exams/:id/date-sheet")
  saveDateSheet(@Param("id") id: string, @Body() body: SaveDateSheetDto) {
    return this.exams.saveDateSheet(id, body);
  }

  /** saveMarks */
  @RequirePermission("acad_enter_marks")
  @Put("exam-marks")
  saveMarks(@Body() body: SaveMarksDto) {
    return this.exams.saveMarks(body);
  }

  /** setResultsPublished */
  @RequirePermission("acad_lock_gradebook")
  @Post("exams/:id/publish")
  setResultsPublished(@Param("id") id: string, @Body() body: SetResultsPublishedDto) {
    return this.exams.setResultsPublished(id, body.published);
  }
}
