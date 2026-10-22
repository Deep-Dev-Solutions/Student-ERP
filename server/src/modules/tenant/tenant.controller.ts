import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TenantService } from "./tenant.service";

@ApiTags("tenant")
@Controller("tenant")
export class TenantController {
  constructor(private readonly tenant: TenantService) {}

  /** getMyTenant */
  @Get()
  get() {
    return this.tenant.get();
  }
}
