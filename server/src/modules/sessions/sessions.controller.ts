import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../common/decorators";
import { AddSessionDto, CurrentSessionDto } from "./dto/session.dto";
import { SessionsService } from "./sessions.service";

@ApiTags("sessions")
@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  /** getSessions */
  @Get()
  list() {
    return this.sessions.list();
  }

  /** addSession */
  @RequirePermission("adm_system_settings")
  @Post()
  add(@Body() body: AddSessionDto) {
    return this.sessions.add(body);
  }

  /** setCurrentSession */
  @RequirePermission("adm_system_settings")
  @Put("current")
  setCurrent(@Body() body: CurrentSessionDto) {
    return this.sessions.setCurrent(body.sessionId);
  }
}
