import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NoTenant } from "../../common/decorators";
import type { AuthedRequest } from "../../common/guards/auth.guard";
import { ActiveTenantDto } from "./dto/active-tenant.dto";
import { MeService } from "./me.service";

@ApiTags("me")
@Controller("me")
export class MeController {
  constructor(private readonly me: MeService) {}

  /** Who is signed in, the schools they belong to, and the active one. */
  @NoTenant()
  @Get()
  whoAmI(@Req() req: AuthedRequest) {
    return this.me.me(req);
  }

  /** Switches the active school for this session. */
  @NoTenant()
  @Post("active-tenant")
  setActive(@Req() req: AuthedRequest, @Body() body: ActiveTenantDto) {
    return this.me.setActive(req, body.tenantId);
  }
}
