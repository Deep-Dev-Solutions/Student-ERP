import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule } from "../../common/decorators";
import { DashboardService } from "./dashboard.service";

/**
 * Figures for the admin dashboard widgets, each gated behind the module it
 * actually needs (same modules the widgets themselves check with <ModuleOnly>).
 * Computed for the school's first campus (alphabetically), the same fallback
 * the client's useCurrentBranch() uses when nothing more specific is picked.
 */
@ApiTags("dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @RequireModule("attendance")
  @Get("register-summary")
  registerSummary() {
    return this.dashboard.registerSummary();
  }

  @RequireModule("attendance")
  @Get("attendance-trend")
  attendanceTrend() {
    return this.dashboard.attendanceTrend();
  }

  @RequireModule("fees")
  @Get("fee-target")
  feeTarget() {
    return this.dashboard.feeTarget();
  }

  @RequireModule("fees")
  @Get("fee-collection")
  feeCollection() {
    return this.dashboard.feeCollection();
  }

  @RequireModule("students")
  @Get("students-summary")
  studentsSummary() {
    return this.dashboard.studentsSummary();
  }
}
