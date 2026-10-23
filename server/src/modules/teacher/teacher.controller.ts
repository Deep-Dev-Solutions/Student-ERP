import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TeacherService } from "./teacher.service";

/** The teacher portal home: today's schedule, pending tasks and a summary. */
@ApiTags("teacher")
@Controller("teacher")
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  /** getTeacherDay */
  @Get("day")
  day() {
    return this.teacher.day();
  }
}
