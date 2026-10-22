import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../common/decorators";
import { InviteUserDto } from "./dto/invite-user.dto";
import { UserStatusDto } from "./dto/user-status.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** getUsers */
  @Get()
  list() {
    return this.users.list();
  }

  /** inviteUser */
  @RequirePermission("adm_system_settings")
  @Post()
  invite(@Body() body: InviteUserDto) {
    return this.users.invite(body);
  }

  /** setUserStatus */
  @RequirePermission("adm_system_settings")
  @Patch(":id/status")
  setStatus(@Param("id") id: string, @Body() body: UserStatusDto) {
    return this.users.setStatus(id, body.status);
  }
}
