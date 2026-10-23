import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { StaffService } from "./staff.service";
import { SaveStaffDto } from "./dto/save-staff.dto";
import { StaffStatusDto } from "./dto/staff-status.dto";
import { SetAllocationDto } from "./dto/set-allocation.dto";

/** Staff records and teaching allocations. Gated behind the Staff module. */
@ApiTags("staff")
@RequireModule("staff")
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  /** getStaff */
  @Get("staff")
  list() {
    return this.staff.list();
  }

  /** getTeachers */
  @Get("staff/teachers")
  listTeachers() {
    return this.staff.listTeachers();
  }

  /** saveStaff */
  @RequirePermission("adm_onboard_staff")
  @Put("staff")
  saveStaff(@Body() body: SaveStaffDto) {
    return this.staff.saveStaff(body);
  }

  /** setStaffStatus */
  @RequirePermission("adm_onboard_staff")
  @Post("staff/:id/status")
  setStatus(@Param("id") id: string, @Body() body: StaffStatusDto) {
    return this.staff.setStaffStatus(id, body.status, body.date, body.reason);
  }

  /** getAllocations */
  @Get("allocations")
  listAllocations() {
    return this.staff.listAllocations();
  }

  /** setAllocation */
  @RequirePermission("acad_manage_allocations")
  @Put("allocations")
  setAllocation(@Body() body: SetAllocationDto) {
    return this.staff.setAllocation(body);
  }
}
