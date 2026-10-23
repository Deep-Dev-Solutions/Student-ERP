import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { PaperMakerService } from "./paper-maker.service";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { ReturnPaperDto } from "./dto/return-paper.dto";

/** The global catalogue, question bank, and a school's own papers. Gated behind the Paper maker module. */
@ApiTags("paper-maker")
@RequireModule("paper_maker")
@Controller()
export class PaperMakerController {
  constructor(private readonly papers: PaperMakerService) {}

  /** getPaperCatalog */
  @Get("paper-catalog")
  getCatalog() {
    return this.papers.getCatalog();
  }

  /** getQuestionBank */
  @Get("question-bank")
  getQuestionBank() {
    return this.papers.getQuestionBank();
  }

  /** getPapers */
  @Get("papers")
  list() {
    return this.papers.list();
  }

  /** getPrintablePaper */
  @RequirePermission("canPrintPapers")
  @Get("papers/:id/printable")
  getPrintable(@Param("id") id: string) {
    return this.papers.getPrintable(id);
  }

  /** savePaperDraft: create */
  @Post("papers")
  create(@Body() body: SaveDraftDto) {
    return this.papers.saveDraft(body);
  }

  /** savePaperDraft: save an existing draft */
  @Put("papers")
  save(@Body() body: SaveDraftDto) {
    return this.papers.saveDraft(body);
  }

  /** submitPaper */
  @Post("papers/:id/submit")
  submit(@Param("id") id: string) {
    return this.papers.submit(id);
  }

  /** markPaperPrinted */
  @Post("papers/:id/printed")
  markPrinted(@Param("id") id: string) {
    return this.papers.markPrinted(id);
  }

  /** returnPaper */
  @Post("papers/:id/return")
  returnPaper(@Param("id") id: string, @Body() body: ReturnPaperDto) {
    return this.papers.returnToTeacher(id, body.note);
  }
}
