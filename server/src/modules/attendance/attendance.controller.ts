import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { AttendanceService } from "./attendance.service";
import { SubmitRegisterDto } from "./dto/submit-register.dto";
import { DecideUnlockDto, RequestUnlockDto, UnlockRegisterDto } from "./dto/unlock.dto";
import { SaveStaffAttendanceDto } from "./dto/staff-attendance.dto";

/** Registers, unlock requests and staff attendance. Gated behind the Attendance module. */
@ApiTags("attendance")
@RequireModule("attendance")
@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  /** getRegisters */
  @Get("registers")
  listRegisters() {
    return this.attendance.listRegisters();
  }

  /** submitRegister: who may mark is decided in the service (class incharge, subject allocation, mode), not a static permission. */
  @Put("registers")
  submitRegister(@Body() body: SubmitRegisterDto) {
    return this.attendance.submitRegister(body);
  }

  /** lockRegisters */
  @RequirePermission("att_lock_roster")
  @Post("registers/lock")
  lockRegisters(@Body() ids: string[]) {
    return this.attendance.lockRegisters(ids);
  }

  /** unlockRegister */
  @RequirePermission("att_lock_roster")
  @Post("registers/:id/unlock")
  unlockRegister(@Param("id") id: string, @Body() body: UnlockRegisterDto) {
    return this.attendance.unlockRegister(id, body);
  }

  /** markAlertsSent */
  @RequirePermission("att_send_alerts")
  @Post("registers/alerts")
  markAlertsSent(@Body() ids: string[]) {
    return this.attendance.markAlertsSent(ids);
  }

  /** getUnlockRequests */
  @Get("unlock-requests")
  listUnlockRequests() {
    return this.attendance.listUnlockRequests();
  }

  /** requestUnlock */
  @Post("unlock-requests")
  requestUnlock(@Body() body: RequestUnlockDto) {
    return this.attendance.requestUnlock(body);
  }

  /** decideUnlock */
  @RequirePermission("att_lock_roster")
  @Post("unlock-requests/:id/decision")
  decideUnlock(@Param("id") id: string, @Body() body: DecideUnlockDto) {
    return this.attendance.decideUnlock(id, body);
  }

  /** getStaffAttendance */
  @Get("staff-attendance")
  listStaffAttendance() {
    return this.attendance.listStaffAttendance();
  }

  /** saveStaffAttendance */
  @RequirePermission("att_mark_daily")
  @Put("staff-attendance/:date")
  saveStaffAttendance(@Param("date") date: string, @Body() body: SaveStaffAttendanceDto) {
    return this.attendance.saveStaffAttendance(date, body);
  }
}
