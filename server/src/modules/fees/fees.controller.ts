import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { FeesService } from "./fees.service";
import { FeeHeadDto } from "./dto/fee-head.dto";
import { FeePlanDto } from "./dto/fee-plan.dto";
import { ConcessionDto } from "./dto/concession.dto";
import { CancelVoucherDto, GenerateVouchersDto } from "./dto/voucher.dto";
import { RecordPaymentDto, ReversePaymentDto } from "./dto/payment.dto";
import { CloseDayDto } from "./dto/day-closing.dto";

/** Fee heads, plans, concessions, vouchers, payments, day closings and reminders. Gated behind the Fees module. */
@ApiTags("fees")
@RequireModule("fees")
@Controller()
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  /** getFeeHeads */
  @Get("fee-heads")
  listFeeHeads() {
    return this.fees.listFeeHeads();
  }

  /** saveFeeHead */
  @RequirePermission("fin_manage_fees")
  @Put("fee-heads")
  saveFeeHead(@Body() body: FeeHeadDto) {
    return this.fees.saveFeeHead(body);
  }

  /** removeFeeHead */
  @RequirePermission("fin_manage_fees")
  @Delete("fee-heads/:id")
  removeFeeHead(@Param("id") id: string) {
    return this.fees.removeFeeHead(id);
  }

  /** getFeePlans */
  @Get("fee-plans")
  listFeePlans() {
    return this.fees.listFeePlans();
  }

  /** saveFeePlan */
  @RequirePermission("fin_manage_fees")
  @Put("fee-plans")
  saveFeePlan(@Body() body: FeePlanDto) {
    return this.fees.saveFeePlan(body);
  }

  /** getConcessions */
  @Get("concessions")
  listConcessions() {
    return this.fees.listConcessions();
  }

  /** saveConcession */
  @RequirePermission("fin_manage_fees")
  @Put("concessions")
  saveConcession(@Body() body: ConcessionDto) {
    return this.fees.saveConcession(body);
  }

  /** removeConcession */
  @RequirePermission("fin_manage_fees")
  @Delete("concessions/:id")
  removeConcession(@Param("id") id: string) {
    return this.fees.removeConcession(id);
  }

  /** getVouchers */
  @Get("vouchers")
  listVouchers() {
    return this.fees.listVouchers();
  }

  /** generateVouchers: runs synchronously for now, same as every other "(job)" endpoint before BullMQ is wired in. */
  @RequirePermission("fin_manage_fees")
  @Post("vouchers/generate")
  generateVouchers(@Body() body: GenerateVouchersDto) {
    return this.fees.generateVouchers(body);
  }

  /** cancelVoucher */
  @RequirePermission("fin_manage_fees")
  @Post("vouchers/:id/cancel")
  cancelVoucher(@Param("id") id: string, @Body() body: CancelVoucherDto) {
    return this.fees.cancelVoucher(id, body);
  }

  /** getPayments */
  @Get("payments")
  listPayments() {
    return this.fees.listPayments();
  }

  /** recordPayment: body.idempotencyKey makes a retried request a no-op instead of a double charge. */
  @RequirePermission("fin_collect_fee")
  @Post("payments")
  recordPayment(@Body() body: RecordPaymentDto) {
    return this.fees.recordPayment(body, body.idempotencyKey);
  }

  /** reversePayment */
  @RequirePermission("fin_waive_fee")
  @Post("payments/:id/reverse")
  reversePayment(@Param("id") id: string, @Body() body: ReversePaymentDto) {
    return this.fees.reversePayment(id, body);
  }

  /** getDayClosings */
  @Get("day-closings")
  listDayClosings() {
    return this.fees.listDayClosings();
  }

  /** closeDay */
  @RequirePermission("fin_collect_fee")
  @Post("day-closings")
  closeDay(@Body() body: CloseDayDto) {
    return this.fees.closeDay(body);
  }

  /** getFeeReminders */
  @Get("fee-reminders")
  listFeeReminders() {
    return this.fees.listFeeReminders();
  }

  /** sendFeeReminders */
  @RequirePermission("fin_send_sms")
  @Post("fee-reminders")
  sendFeeReminders(@Body() studentIds: string[]) {
    return this.fees.sendFeeReminders(studentIds);
  }
}
