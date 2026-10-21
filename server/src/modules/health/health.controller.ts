import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  ok() {
    return { ok: true };
  }
}
