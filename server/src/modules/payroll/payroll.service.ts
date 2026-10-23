import { Injectable } from "@nestjs/common";
import { computePayslip, periodsOf } from "../../domain/payroll";
import { AuditService } from "../../common/audit.service";
import { actorName, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, toAdvance, toPayrollRun, toPayslip } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { StartPayrollDto } from "./dto/payroll-run.dto";
import type { MarkPayslipsPaidDto, UpdatePayslipDto } from "./dto/payslip.dto";
import type { AddAdvanceDto } from "./dto/advance.dto";

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Payroll runs --------------------------------------------------------------

  /** getPayrollRuns */
  async listRuns() {
    return (await this.prisma.tenant.payrollRun.findMany({ orderBy: { month: "desc" } })).map(toPayrollRun);
  }

  /** startPayroll: a draft payslip for everyone on staff, with absences from staff attendance. */
  async startPayroll(body: StartPayrollDto) {
    const tenantId = requireTenantId();
    if (await this.prisma.tenant.payrollRun.findFirst({ where: { branchId: body.branchId, month: body.month } })) throw fail(409, "Payroll for this month has already started");

    const [members, allocations, attendanceDays, advances] = await Promise.all([
      this.prisma.tenant.staffMember.findMany({ where: { branchId: body.branchId } }),
      this.prisma.tenant.teacherAllocation.findMany(),
      this.prisma.tenant.staffAttendanceDay.findMany({ where: { branchId: body.branchId } }),
      this.prisma.tenant.advance.findMany(),
    ]);
    const eligible = members.filter((m) => m.status !== "terminated" || ((m.left as { date?: string } | null)?.date ?? "") >= `${body.month}-01`);

    const run = await this.prisma.tx(async (tx) => {
      const created = await tx.payrollRun.create({ data: { tenantId, branchId: body.branchId, month: body.month, status: "draft", createdAt: new Date(), createdBy: actorName() } });
      for (const member of eligible) {
        const absentDays = attendanceDays.filter((d) => d.date.toISOString().slice(0, 7) === body.month).filter((d) => (d.marks as Record<string, string>)[member.staffId] === "absent").length;
        const advance = advances.find((a) => a.staffId === member.staffId && a.recovered < a.amount);
        const advanceRecovery = advance ? Math.min(advance.monthlyRecovery, advance.amount - advance.recovered) : 0;
        const figures = computePayslip(
          { staffId: member.staffId, basicSalary: member.basicSalary, allowances: member.allowances as { label: string; amount: number }[], employment: member.employment as "permanent" | "contract" | "visiting" },
          { id: "", runId: created.id, month: body.month, status: "draft" },
          { absentDays, adjustments: [], advanceRecovery, periodsPerWeek: periodsOf(member.staffId, allocations) },
        );
        await tx.payslip.create({
          data: {
            tenantId,
            runId: created.id,
            staffId: figures.staffId,
            month: body.month,
            basic: figures.basic,
            allowances: figures.allowances as unknown as Prisma.InputJsonValue,
            adjustments: figures.adjustments as unknown as Prisma.InputJsonValue,
            absentDays: figures.absentDays,
            absentDeduction: figures.absentDeduction,
            advanceRecovery: figures.advanceRecovery,
            tax: figures.tax,
            eobi: figures.eobi,
            gross: figures.gross,
            totalDeductions: figures.totalDeductions,
            net: figures.net,
            periodsPerWeek: figures.periodsPerWeek,
            status: "draft",
          },
        });
      }
      return created;
    });
    await this.audit.record("payroll.started", "payroll_run", run.id, { month: body.month });
    return toPayrollRun(run);
  }

  async finalisePayroll(runId: string) {
    const run = await this.prisma.tenant.payrollRun.findFirst({ where: { id: runId } });
    if (!run || run.status !== "draft") throw fail(409, "Only a draft payroll can be finalised");
    await this.prisma.tenant.payrollRun.update({ where: { id: runId }, data: { status: "finalised", finalisedAt: new Date() } });
    await this.audit.record("payroll.finalised", "payroll_run", runId);
    return null;
  }

  // Payslips --------------------------------------------------------------

  /** getPayslips */
  async listPayslips() {
    return (await this.prisma.tenant.payslip.findMany({ orderBy: { month: "desc" } })).map(toPayslip);
  }

  /** updatePayslip: changes a draft payslip's absences or one-off adjustments and recalculates it. */
  async updatePayslip(id: string, body: UpdatePayslipDto) {
    const slip = await this.prisma.tenant.payslip.findFirst({ where: { id } });
    if (!slip) throw fail(404, "Payslip not found");
    const run = await this.prisma.tenant.payrollRun.findFirst({ where: { id: slip.runId } });
    if (run?.status !== "draft") throw fail(409, "This payroll is finalised; payslips can't change");
    if (body.adjustments.some((a) => !a.label.trim() || !Number.isInteger(a.amount) || a.amount === 0)) throw fail(400, "Each adjustment needs a label and an amount");

    const member = await this.prisma.tenant.staffMember.findFirst({ where: { staffId: slip.staffId } });
    if (!member) throw fail(404, "Staff member not found");
    const figures = computePayslip(
      { staffId: member.staffId, basicSalary: member.basicSalary, allowances: member.allowances as { label: string; amount: number }[], employment: member.employment as "permanent" | "contract" | "visiting" },
      { id: slip.id, runId: slip.runId, month: slip.month, status: slip.status as "draft" | "paid" },
      { absentDays: body.absentDays, adjustments: body.adjustments, advanceRecovery: slip.advanceRecovery, periodsPerWeek: slip.periodsPerWeek },
    );
    const updated = await this.prisma.tenant.payslip.update({
      where: { id },
      data: {
        absentDays: figures.absentDays,
        absentDeduction: figures.absentDeduction,
        adjustments: figures.adjustments as unknown as Prisma.InputJsonValue,
        tax: figures.tax,
        gross: figures.gross,
        totalDeductions: figures.totalDeductions,
        net: figures.net,
      },
    });
    return toPayslip(updated);
  }

  /** markPayslipsPaid: marks payslips paid and takes their advance recoveries off the advances. */
  async markPayslipsPaid(body: MarkPayslipsPaidDto) {
    const slips = await this.prisma.tenant.payslip.findMany({ where: { id: { in: body.ids }, status: "draft" } });
    const runs = await this.prisma.tenant.payrollRun.findMany({ where: { id: { in: slips.map((s) => s.runId) } } });
    if (slips.some((s) => runs.find((r) => r.id === s.runId)?.status === "draft")) throw fail(409, "Finalise the payroll before paying");

    await this.prisma.tx(async (tx) => {
      const paidAt = new Date();
      await tx.payslip.updateMany({ where: { id: { in: slips.map((s) => s.id) } }, data: { status: "paid", paidAt, method: body.method } });
      for (const slip of slips) {
        if (!slip.advanceRecovery) continue;
        const candidates = await tx.advance.findMany({ where: { staffId: slip.staffId } });
        const active = candidates.find((a) => a.recovered < a.amount);
        if (active) await tx.advance.update({ where: { id: active.id }, data: { recovered: Math.min(active.amount, active.recovered + slip.advanceRecovery) } });
      }
      const runIds = new Set(slips.map((s) => s.runId));
      for (const runId of runIds) {
        const all = await tx.payslip.findMany({ where: { runId } });
        if (all.every((p) => p.status === "paid")) await tx.payrollRun.update({ where: { id: runId }, data: { status: "paid" } });
      }
    });
    return null;
  }

  // Advances --------------------------------------------------------------

  /** getAdvances */
  async listAdvances() {
    return (await this.prisma.tenant.advance.findMany()).map(toAdvance);
  }

  async addAdvance(body: AddAdvanceDto) {
    const reason = body.reason.trim();
    if (!reason) throw fail(400, "Give a reason");
    if (body.monthlyRecovery > body.amount) throw fail(400, "Monthly recovery should be more than 0 and no more than the advance");
    const existing = await this.prisma.tenant.advance.findMany({ where: { staffId: body.staffId } });
    if (existing.some((a) => a.recovered < a.amount)) throw fail(409, "This person is still repaying an advance");

    const created = await this.prisma.tenant.advance.create({
      data: { tenantId: requireTenantId(), staffId: body.staffId, amount: body.amount, date: parseDay(body.date), reason, monthlyRecovery: body.monthlyRecovery, recovered: 0 },
    });
    return toAdvance(created);
  }
}
