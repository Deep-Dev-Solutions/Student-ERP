// Unit tests for the ported business rules in src/domain/payroll.ts (compare to
// client/src/lib/payroll.ts: monthlyTax, computePayslip, periodsOf).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { monthlyTax, computePayslip, monthlyGross, periodsOf, WORKING_DAYS, EOBI_EMPLOYEE } = require("../../dist/domain/payroll.js");

describe("monthlyTax", () => {
  test("no tax below the first slab", () => assert.equal(monthlyTax(40_000), 0));
  test("a mid-range salary falls in the 11% slab", () => {
    // Annual 1,440,000 falls in (1.2M, 2.2M]; base 6,000 + (1,440,000-1,200,000)*0.11 = 32,400 / 12
    assert.equal(monthlyTax(120_000), Math.round(32_400 / 12));
  });
  test("a high salary uses the top slab", () => {
    const monthly = 500_000;
    const annual = monthly * 12;
    const expected = Math.round((616_000 + (annual - 4_100_000) * 0.35) / 12);
    assert.equal(monthlyTax(monthly), expected);
  });
});

describe("computePayslip", () => {
  const member = { staffId: "STF-201", basicSalary: 120_000, allowances: [{ label: "House rent", amount: 30_000 }], employment: "permanent" };
  const base = { id: "slip-1", runId: "run-1", month: "2026-10", status: "draft" };

  test("gross includes basic, allowances and positive adjustments only", () => {
    const slip = computePayslip(member, base, { absentDays: 0, adjustments: [{ label: "Bonus", amount: 5000 }, { label: "Fine", amount: -1000 }], advanceRecovery: 0, periodsPerWeek: 20 });
    assert.equal(slip.gross, 120_000 + 30_000 + 5000);
  });
  test("absences are deducted at a per-working-day rate", () => {
    const slip = computePayslip(member, base, { absentDays: 2, adjustments: [], advanceRecovery: 0, periodsPerWeek: 20 });
    assert.equal(slip.absentDeduction, Math.round((120_000 / WORKING_DAYS) * 2));
  });
  test("permanent staff pay EOBI, others don't", () => {
    const permanent = computePayslip(member, base, { absentDays: 0, adjustments: [], advanceRecovery: 0, periodsPerWeek: 20 });
    assert.equal(permanent.eobi, EOBI_EMPLOYEE);
    const contract = computePayslip({ ...member, employment: "contract" }, base, { absentDays: 0, adjustments: [], advanceRecovery: 0, periodsPerWeek: 20 });
    assert.equal(contract.eobi, 0);
  });
  test("advance recovery and negative adjustments both reduce net pay", () => {
    const slip = computePayslip(member, base, { absentDays: 0, adjustments: [{ label: "Fine", amount: -2000 }], advanceRecovery: 5000, periodsPerWeek: 20 });
    // totalDeductions = absentDeduction + eobi + tax + advanceRecovery - sum(reductions); reductions sum to -2000.
    assert.equal(slip.totalDeductions, slip.eobi + slip.tax + 5000 - -2000);
  });
  test("net is gross minus total deductions", () => {
    const slip = computePayslip(member, base, { absentDays: 1, adjustments: [], advanceRecovery: 1000, periodsPerWeek: 20 });
    assert.equal(slip.net, slip.gross - slip.totalDeductions);
  });
});

describe("monthlyGross", () => {
  test("basic plus the sum of allowances", () => assert.equal(monthlyGross({ basicSalary: 50_000, allowances: [{ label: "A", amount: 1000 }, { label: "B", amount: 2000 }] }), 53_000));
});

describe("periodsOf", () => {
  const allocations = [
    { teacherId: "STF-201", weeklyPeriods: 6 },
    { teacherId: "STF-201", weeklyPeriods: 4 },
    { teacherId: "STF-202", weeklyPeriods: 6 },
  ];
  test("sums weekly periods across a teacher's allocations", () => assert.equal(periodsOf("STF-201", allocations), 10));
  test("a teacher with no allocations has zero periods", () => assert.equal(periodsOf("STF-999", allocations), 0));
});
