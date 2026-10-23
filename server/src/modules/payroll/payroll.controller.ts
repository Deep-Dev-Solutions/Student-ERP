import { Body, Controller, Get, Param, Post, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { PayrollService } from "./payroll.service";
import { StartPayrollDto } from "./dto/payroll-run.dto";
import { MarkPayslipsPaidDto, UpdatePayslipDto } from "./dto/payslip.dto";
import { AddAdvanceDto } from "./dto/advance.dto";

/** Payroll runs, payslips and salary advances. Gated behind the Payroll module. */
@ApiTags("payroll")
@RequireModule("payroll")
@Controller()
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  /** getPayrollRuns */
  @Get("payroll-runs")
  listRuns() {
    return this.payroll.listRuns();
  }

  /** startPayroll: runs synchronously for now, same as every other "(job)" endpoint before BullMQ is wired in. */
  @RequirePermission("fin_manage_payroll")
  @Post("payroll-runs")
  startPayroll(@Body() body: StartPayrollDto) {
    return this.payroll.startPayroll(body);
  }

  /** finalisePayroll */
  @RequirePermission("fin_manage_payroll")
  @Post("payroll-runs/:id/finalise")
  finalisePayroll(@Param("id") id: string) {
    return this.payroll.finalisePayroll(id);
  }

  /** getPayslips */
  @Get("payslips")
  listPayslips() {
    return this.payroll.listPayslips();
  }

  /** updatePayslip */
  @RequirePermission("fin_manage_payroll")
  @Patch("payslips/:id")
  updatePayslip(@Param("id") id: string, @Body() body: UpdatePayslipDto) {
    return this.payroll.updatePayslip(id, body);
  }

  /** markPayslipsPaid */
  @RequirePermission("fin_manage_payroll")
  @Post("payslips/paid")
  markPayslipsPaid(@Body() body: MarkPayslipsPaidDto) {
    return this.payroll.markPayslipsPaid(body);
  }

  /** getAdvances */
  @Get("advances")
  listAdvances() {
    return this.payroll.listAdvances();
  }

  /** addAdvance */
  @RequirePermission("fin_manage_payroll")
  @Post("advances")
  addAdvance(@Body() body: AddAdvanceDto) {
    return this.payroll.addAdvance(body);
  }
}
