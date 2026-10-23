import { Injectable } from "@nestjs/common";
import { buildVoucherNumber, feeStanding, lateFineFor, voucherLines } from "../../domain/fees";
import { AuditService } from "../../common/audit.service";
import { actorName, currentContext, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { hasPermission, type PermissionMatrix } from "../../common/permissions";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, todayInSchool, toDayClosing, toFeeReminder, toPayment, toVoucher } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { FeeHeadDto } from "./dto/fee-head.dto";
import type { FeePlanDto } from "./dto/fee-plan.dto";
import type { ConcessionDto } from "./dto/concession.dto";
import type { CancelVoucherDto, GenerateVouchersDto } from "./dto/voucher.dto";
import type { RecordPaymentDto, ReversePaymentDto } from "./dto/payment.dto";
import type { CloseDayDto } from "./dto/day-closing.dto";

const omit = <T extends { tenantId: string }>({ tenantId: _t, ...rest }: T) => rest;
const METHODS = new Set(["cash", "bank", "cheque", "easypaisa"]);

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Recomputes a student's balance and fee status from their vouchers. */
  private async syncFees(tx: Prisma.TransactionClient, studentIds: string[]) {
    for (const studentId of new Set(studentIds)) {
      const vouchers = await tx.feeVoucher.findMany({ where: { studentId }, select: { totalAmount: true, paidAmount: true, status: true } });
      const standing = feeStanding(vouchers);
      await tx.student.update({ where: { id: studentId }, data: standing });
    }
  }

  // Fee heads --------------------------------------------------------------

  async listFeeHeads() {
    return (await this.prisma.tenant.feeHead.findMany({ orderBy: { name: "asc" } })).map(omit);
  }

  async saveFeeHead(body: FeeHeadDto) {
    const name = body.name.trim();
    if (await this.prisma.tenant.feeHead.findFirst({ where: { id: { not: body.id }, name: { equals: name, mode: "insensitive" } } }))
      throw fail(409, `${body.name} already exists`);
    const tenantId = requireTenantId();
    const data = { name, frequency: body.frequency, termMonths: body.termMonths ?? [], discountable: body.discountable };
    const saved = await this.prisma.tenant.feeHead.upsert({ where: { id: body.id }, create: { id: body.id, tenantId, ...data }, update: data });
    return omit(saved);
  }

  async removeFeeHead(id: string) {
    if (id === "tuition") throw fail(400, "Tuition can't be removed");
    await this.prisma.tx(async (tx) => {
      await tx.feeHead.deleteMany({ where: { id } });
      const plans = await tx.feePlan.findMany();
      for (const plan of plans) {
        const amounts = plan.amounts as Record<string, number>;
        if (!(id in amounts)) continue;
        const { [id]: _removed, ...rest } = amounts;
        void _removed;
        await tx.feePlan.update({ where: { id: plan.id }, data: { amounts: rest } });
      }
    });
    return null;
  }

  // Fee plans ----------------------------------------------------------------

  async listFeePlans() {
    return (await this.prisma.tenant.feePlan.findMany()).map(omit);
  }

  async saveFeePlan(body: FeePlanDto) {
    if (Object.values(body.amounts).some((a) => !Number.isInteger(a) || a < 0)) throw fail(400, "Amounts must be whole rupees");
    const tenantId = requireTenantId();
    const data = { branchId: body.branchId, classId: body.classId, amounts: body.amounts as Prisma.InputJsonValue };
    const saved = await this.prisma.tenant.feePlan.upsert({ where: { id: body.id }, create: { id: body.id, tenantId, ...data }, update: data });
    return omit(saved);
  }

  // Concessions ----------------------------------------------------------------

  async listConcessions() {
    return (await this.prisma.tenant.concession.findMany()).map(omit);
  }

  async saveConcession(body: ConcessionDto) {
    const name = body.name.trim();
    const tenantId = requireTenantId();
    const saved = await this.prisma.tenant.concession.upsert({
      where: { id: body.id },
      create: { id: body.id, tenantId, name, percent: body.percent },
      update: { name, percent: body.percent },
    });
    return omit(saved);
  }

  async removeConcession(id: string) {
    await this.prisma.tenant.concession.deleteMany({ where: { id } });
    return null;
  }

  // Vouchers --------------------------------------------------------------

  async listVouchers() {
    return (await this.prisma.tenant.feeVoucher.findMany({ orderBy: { month: "desc" } })).map(toVoucher);
  }

  /** Creates a month's vouchers for the students given; students who already have one are skipped. */
  async generateVouchers(body: GenerateVouchersDto) {
    if (!body.dueDate.startsWith(body.month)) throw fail(400, "The due date should fall in the billing month");
    const tenantId = requireTenantId();
    const issueDate = todayInSchool();
    const heads = (await this.prisma.tenant.feeHead.findMany()) as unknown as { id: string; name: string; frequency: "monthly" | "term" | "one_time"; termMonths: string[]; discountable: boolean }[];

    const result = await this.prisma.tx(async (tx) => {
      let skipped = 0;
      const createdIds: string[] = [];
      for (const studentId of body.studentIds) {
        const student = await tx.student.findFirst({ where: { id: studentId, enrollment: "active" } });
        const existing = student && (await tx.feeVoucher.findFirst({ where: { studentId, month: body.month, status: { not: "cancelled" } } }));
        if (!student || existing) {
          skipped++;
          continue;
        }
        const plan = await tx.feePlan.findFirst({ where: { classId: student.classId } });
        const studentLike = { id: student.id, monthlyFee: student.monthlyFee, discountPercent: student.discountPercent, admissionDate: student.admissionDate.toISOString().slice(0, 10) };
        const { lines, discount } = voucherLines(studentLike, body.month, plan ? { amounts: plan.amounts as Record<string, number> } : undefined, heads);
        const totalAmount = lines.reduce((n, l) => n + l.amount, 0) - discount;
        const created = await tx.feeVoucher.create({
          data: {
            tenantId,
            voucherNumber: buildVoucherNumber(body.month, student.id),
            studentId: student.id,
            branchId: student.branchId,
            classId: student.classId,
            sectionId: student.sectionId,
            month: body.month,
            issueDate: parseDay(issueDate),
            dueDate: parseDay(body.dueDate),
            lines: lines as unknown as Prisma.InputJsonValue,
            discount,
            totalAmount,
            paidAmount: 0,
            status: "unpaid",
          },
        });
        createdIds.push(created.studentId);
      }
      await this.syncFees(tx, createdIds);
      return { created: createdIds.length, skipped };
    });
    return result;
  }

  async cancelVoucher(id: string, body: CancelVoucherDto) {
    if (body.reason.trim().length < 5) throw fail(400, "Give a reason for cancelling.");
    const voucher = await this.prisma.tenant.feeVoucher.findFirst({ where: { id } });
    if (!voucher) throw fail(404, "Voucher not found");
    if (voucher.paidAmount > 0) throw fail(409, "Payments were taken on this voucher. Reverse them first.");
    await this.prisma.tx(async (tx) => {
      await tx.feeVoucher.update({ where: { id }, data: { status: "cancelled", cancelled: { at: new Date().toISOString(), by: actorName(), reason: body.reason.trim() } } });
      await this.syncFees(tx, [voucher.studentId]);
      await tx.studentActivity.create({ data: { tenantId: requireTenantId(), studentId: voucher.studentId, actor: actorName(), text: `Voucher ${voucher.voucherNumber} cancelled: ${body.reason.trim()}` } });
    });
    await this.audit.record("voucher.cancelled", "fee_voucher", id, { reason: body.reason.trim() });
    return null;
  }

  // Payments --------------------------------------------------------------

  async listPayments() {
    return (await this.prisma.tenant.payment.findMany({ orderBy: { at: "desc" } })).map(toPayment);
  }

  /** Records a full or partial payment against a voucher. The late fine is independently verified, not trusted blindly. */
  async recordPayment(body: RecordPaymentDto, idempotencyKey: string | undefined) {
    const tenantId = requireTenantId();
    if (idempotencyKey) {
      const existing = await this.prisma.tenant.payment.findFirst({ where: { idempotencyKey } });
      if (existing) return toPayment(existing);
    }

    const voucher = await this.prisma.tenant.feeVoucher.findFirst({ where: { id: body.voucherId } });
    if (!voucher) throw fail(404, "Voucher not found");
    if (voucher.status === "cancelled") throw fail(409, "This voucher was cancelled");
    const due = Math.max(0, voucher.totalAmount - voucher.paidAmount);
    if (due === 0) throw fail(409, "This voucher is already paid");
    if (!Number.isInteger(body.amount) || body.amount <= 0) throw fail(400, "Enter the amount received in whole rupees");
    if (body.amount > due) throw fail(400, `Only Rs ${due.toLocaleString("en-US")} is due on this voucher`);

    const rules = await this.prisma.tenant.schoolRules.findFirst();
    const feesRules = (rules?.fees as { dueDay: number; lateFinePerDay: number; graceDays: number; siblingDiscountPercent: number } | undefined) ?? {
      dueDay: 10,
      lateFinePerDay: 0,
      graceDays: 0,
      siblingDiscountPercent: 0,
    };
    const owedFine = lateFineFor({ totalAmount: voucher.totalAmount, paidAmount: voucher.paidAmount, status: voucher.status, dueDate: voucher.dueDate.toISOString().slice(0, 10) }, todayInSchool(), feesRules);
    const lateFine = Math.max(0, body.lateFine);
    if (lateFine < owedFine) {
      const ctx = currentContext();
      const permRow = await this.prisma.tenant.tenantPermissions.findFirst();
      if (!hasPermission(ctx.role ?? "", "fin_waive_fee", (permRow?.matrix ?? {}) as PermissionMatrix)) throw fail(403, "Only certain roles can waive the late fine");
    }

    const created = await this.prisma.tx(async (tx) => {
      const counter = await tx.counter.upsert({ where: { tenantId_key: { tenantId, key: "receipt" } }, create: { tenantId, key: "receipt", value: 1 }, update: { value: { increment: 1 } } });
      const payment = await tx.payment.create({
        data: {
          tenantId,
          receiptNo: `REC-${String(counter.value).padStart(5, "0")}`,
          voucherId: body.voucherId,
          studentId: voucher.studentId,
          branchId: voucher.branchId,
          amount: body.amount,
          lateFine,
          method: body.method,
          at: new Date(),
          by: actorName(),
          idempotencyKey: idempotencyKey ?? null,
        },
      });
      const paidAmount = voucher.paidAmount + body.amount;
      await tx.feeVoucher.update({ where: { id: voucher.id }, data: { paidAmount, status: paidAmount >= voucher.totalAmount ? "paid" : "partial" } });
      await this.syncFees(tx, [voucher.studentId]);
      await tx.studentActivity.create({
        data: {
          tenantId,
          studentId: voucher.studentId,
          actor: actorName(),
          text: `Paid Rs ${body.amount.toLocaleString("en-US")}${lateFine ? ` plus Rs ${lateFine.toLocaleString("en-US")} late fine` : ""} in ${body.method}, receipt ${payment.receiptNo}.`,
        },
      });
      return payment;
    });
    await this.audit.record("payment.recorded", "payment", created.id, { amount: body.amount });
    return toPayment(created);
  }

  /** Undoes a payment, with a reason. The receipt stays on record, marked reversed. */
  async reversePayment(id: string, body: ReversePaymentDto) {
    if (body.reason.trim().length < 10) throw fail(400, "Explain why the payment is being reversed.");
    const payment = await this.prisma.tenant.payment.findFirst({ where: { id } });
    if (!payment) throw fail(404, "Payment not found");
    if (payment.reversed) throw fail(409, "This payment was already reversed");
    const closed = await this.prisma.tenant.dayClosing.findFirst({ where: { branchId: payment.branchId, date: parseDay(payment.at.toISOString().slice(0, 10)) } });
    if (closed) throw fail(409, "That day is closed. Record a correction on today's date instead.");

    await this.prisma.tx(async (tx) => {
      await tx.payment.update({ where: { id }, data: { reversed: { at: new Date().toISOString(), by: actorName(), reason: body.reason.trim() } } });
      const voucher = await tx.feeVoucher.findFirstOrThrow({ where: { id: payment.voucherId } });
      const paidAmount = Math.max(0, voucher.paidAmount - payment.amount);
      await tx.feeVoucher.update({ where: { id: voucher.id }, data: { paidAmount, status: paidAmount >= voucher.totalAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid" } });
      await this.syncFees(tx, [payment.studentId]);
      await tx.studentActivity.create({ data: { tenantId: requireTenantId(), studentId: payment.studentId, actor: actorName(), text: `Receipt ${payment.receiptNo} reversed: ${body.reason.trim()}` } });
    });
    await this.audit.record("payment.reversed", "payment", id);
    return null;
  }

  // Day closings --------------------------------------------------------------

  async listDayClosings() {
    return (await this.prisma.tenant.dayClosing.findMany({ orderBy: { date: "desc" } })).map(toDayClosing);
  }

  /** Closes a day's collections at a campus. After this, that day's payments can't be reversed. */
  async closeDay(body: CloseDayDto) {
    if (Object.keys(body.totals).some((m) => !METHODS.has(m))) throw fail(400, "Unknown payment method in the day's totals");
    if (!Number.isInteger(body.cashCounted) || body.cashCounted < 0) throw fail(400, "Enter the cash counted in whole rupees");
    const tenantId = requireTenantId();
    if (await this.prisma.tenant.dayClosing.findFirst({ where: { branchId: body.branchId, date: parseDay(body.date) } })) throw fail(409, "This day is already closed");
    const created = await this.prisma.tenant.dayClosing.create({
      data: {
        tenantId,
        branchId: body.branchId,
        date: parseDay(body.date),
        totals: body.totals as Prisma.InputJsonValue,
        cashCounted: body.cashCounted,
        note: body.note,
        closedAt: new Date(),
        closedBy: actorName(),
      },
    });
    return toDayClosing(created);
  }

  // Fee reminders --------------------------------------------------------------

  async listFeeReminders() {
    return (await this.prisma.tenant.feeReminder.findMany({ orderBy: { at: "desc" } })).map(toFeeReminder);
  }

  async sendFeeReminders(studentIds: string[]) {
    const tenantId = requireTenantId();
    const at = new Date();
    const by = actorName();
    await this.prisma.tx(async (tx) => {
      await tx.feeReminder.createMany({ data: studentIds.map((studentId) => ({ tenantId, studentId, at, by })) });
      for (const studentId of studentIds) await tx.studentActivity.create({ data: { tenantId, studentId, actor: by, text: "Fee reminder sent by SMS." } });
    });
    return null;
  }
}
