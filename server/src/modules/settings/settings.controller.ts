import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../common/decorators";
import { CampusProfileDto } from "./dto/campus-profile.dto";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** getCampusProfile */
  @Get("campus-profile")
  profile() {
    return this.settings.profile();
  }

  /** updateCampusProfile */
  @RequirePermission("adm_system_settings")
  @Put("campus-profile")
  updateProfile(@Body() body: CampusProfileDto) {
    return this.settings.updateProfile(body);
  }

  /** getRolePermissions */
  @Get("permissions")
  permissions() {
    return this.settings.permissions();
  }

  /** updateRolePermissions: only the owner, so no one can grant themselves more access. */
  @RequirePermission("adm_system_settings")
  @Put("permissions")
  updatePermissions(@Body() body: unknown) {
    return this.settings.updatePermissions(body);
  }

  /** getSchoolRules */
  @Get("rules")
  rules() {
    return this.settings.rules();
  }

  /** updateSchoolRules */
  @RequirePermission("adm_system_settings")
  @Put("rules")
  updateRules(@Body() body: unknown) {
    return this.settings.updateRules(body);
  }
}
