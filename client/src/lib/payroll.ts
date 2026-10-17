/*
 * Payroll calculations shared by the demo data, the API and the screens.
 * Tax is an estimate from the salaried income tax slabs; the real figure
 * should come from the school's tax adviser or the backend.
 */
import type { Payslip, SalaryComponent, StaffMember } from "@/types";

/** Working days used to turn a monthly basic salary into a day's pay. */
export const WORKING_DAYS = 26;
/** Employee's monthly EOBI contribution (permanent staff). */
export const EOBI_EMPLOYEE = 370;
/** Periods a week above which a teacher's load is flagged. */
export const MAX_WEEKLY_PERIODS = 30;

/** Monthly income tax estimate from annual salaried slabs. */
export function monthlyTax(monthlyGross: number) {
  const annual = monthlyGross * 12;
  const slabs: [limit: number, base: number, rate: number][] = [
    [600_000, 0, 0],
    [1_200_000, 0, 0.01],
    [2_200_000, 6_000, 0.11],
    [3_200_000, 116_000, 0.23],
    [4_100_000, 346_000, 0.3],
    [Infinity, 616_000, 0.35],
  ];
  let lower = 0;
  for (const [limit, base, rate] of slabs) {
    if (annual <= limit) return Math.round((base + (annual - lower) * rate) / 12);
    lower = limit;
  }
  return 0;
}

const sum = (items: SalaryComponent[]) => items.reduce((n, i) => n + i.amount, 0);

/** Builds or recalculates a payslip's figures. */
export function computePayslip(
  member: StaffMember,
  base: Pick<Payslip, "id" | "runId" | "month" | "status"> & Partial<Pick<Payslip, "paidAt" | "method">>,
  input: { absentDays: number; adjustments: SalaryComponent[]; advanceRecovery: number; periodsPerWeek: number }
): Payslip {
  const additions = input.adjustments.filter((a) => a.amount > 0);
  const reductions = input.adjustments.filter((a) => a.amount < 0);
  const gross = member.basicSalary + sum(member.allowances) + sum(additions);
  const absentDeduction = Math.round((member.basicSalary / WORKING_DAYS) * input.absentDays);
  const eobi = member.employment === "permanent" ? EOBI_EMPLOYEE : 0;
  const tax = monthlyTax(gross - absentDeduction);
  const totalDeductions = absentDeduction + eobi + tax + input.advanceRecovery - sum(reductions);
  return {
    ...base,
    staffId: member.staffId,
    basic: member.basicSalary,
    allowances: member.allowances,
    adjustments: input.adjustments,
    absentDays: input.absentDays,
    absentDeduction,
    advanceRecovery: input.advanceRecovery,
    tax,
    eobi,
    gross,
    totalDeductions,
    net: gross - totalDeductions,
    periodsPerWeek: input.periodsPerWeek,
  };
}

/** Monthly salary before deductions. */
export const monthlyGross = (m: Pick<StaffMember, "basicSalary" | "allowances">) => m.basicSalary + sum(m.allowances);
