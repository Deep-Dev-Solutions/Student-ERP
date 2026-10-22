import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../common/decorators";
import { BranchesService } from "./branches.service";
import { AddBranchDto } from "./dto/add-branch.dto";

@ApiTags("branches")
@Controller("branches")
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  /** getBranches */
  @Get()
  list() {
    return this.branches.list();
  }

  /** addBranch: campus codes are unique within the school. */
  @RequirePermission("adm_system_settings")
  @Post()
  add(@Body() body: AddBranchDto) {
    return this.branches.add(body);
  }
}
