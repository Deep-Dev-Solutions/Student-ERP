// Unit tests for the ported business rules in src/domain/fees.ts (compare to
// client/src/lib/fees.ts: buildVoucher, settleVoucher, feeStanding, voucherState, lateFineFor, graceEnds).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { voucherBalance, graceEnds, voucherState, daysPast, lateFineFor, voucherLines, feeStanding, buildVoucherNumber } = require("../../dist/domain/fees.js");

describe("voucherBalance", () => {
  test("unpaid minus paid, never negative", () => {
    assert.equal(voucherBalance({ totalAmount: 3000, paidAmount: 1000, status: "partial" }), 2000);
    assert.equal(voucherBalance({ totalAmount: 3000, paidAmount: 3500, status: "paid" }), 0);
  });
  test("a cancelled voucher owes nothing", () => assert.equal(voucherBalance({ totalAmount: 3000, paidAmount: 0, status: "cancelled" }), 0));
});

describe("graceEnds", () => {
  test("adds the grace days to the due date", () => assert.equal(graceEnds("2026-10-10", 5), "2026-10-15"));
  test("zero grace days leaves the due date as is", () => assert.equal(graceEnds("2026-10-10", 0), "2026-10-10"));
});

describe("voucherState", () => {
  const base = { totalAmount: 3000, paidAmount: 0, status: "unpaid", dueDate: "2026-10-10" };
  test("cancelled wins over everything else", () => assert.equal(voucherState({ ...base, status: "cancelled" }, "2026-10-20"), "cancelled"));
  test("fully paid", () => assert.equal(voucherState({ ...base, paidAmount: 3000 }, "2026-10-05"), "paid"));
  test("overdue once past the due date with a balance", () => assert.equal(voucherState(base, "2026-10-11"), "overdue"));
  test("partial before the due date", () => assert.equal(voucherState({ ...base, paidAmount: 1000 }, "2026-10-05"), "partial"));
  test("unpaid before the due date", () => assert.equal(voucherState(base, "2026-10-05"), "unpaid"));
});

describe("lateFineFor", () => {
  const rules = { dueDay: 10, lateFinePerDay: 50, graceDays: 5, siblingDiscountPercent: 10 };
  const voucher = { totalAmount: 3000, paidAmount: 0, status: "unpaid", dueDate: "2026-10-10" };
  test("nothing owed within the grace period", () => assert.equal(lateFineFor(voucher, "2026-10-15", rules), 0));
  test("a fine per day once the grace period ends", () => assert.equal(lateFineFor(voucher, "2026-10-18", rules), 3 * 50));
  test("capped at 30 days even if much later", () => assert.equal(lateFineFor(voucher, "2026-12-25", rules), 30 * 50));
  test("a fully paid voucher owes no fine", () => assert.equal(lateFineFor({ ...voucher, paidAmount: 3000, status: "paid" }, "2026-12-25", rules), 0));
});

describe("daysPast", () => {
  test("whole days between two dates", () => assert.equal(daysPast("2026-10-10", "2026-10-13"), 3));
  test("never negative", () => assert.equal(daysPast("2026-10-13", "2026-10-10"), 0));
});

describe("voucherLines", () => {
  const heads = [
    { id: "tuition", name: "Tuition", frequency: "monthly", termMonths: [], discountable: true },
    { id: "lab", name: "Lab", frequency: "monthly", termMonths: [], discountable: false },
    { id: "exam", name: "Exam fee", frequency: "term", termMonths: ["10", "03"], discountable: false },
    { id: "admission", name: "Admission fee", frequency: "one_time", termMonths: [], discountable: false },
  ];
  const student = { id: "STD-1", monthlyFee: 3000, discountPercent: 10, admissionDate: "2026-10-01" };

  test("tuition always comes from the student's own monthlyFee, discounted", () => {
    const { lines, discount } = voucherLines(student, "2026-10", { amounts: { lab: 300, exam: 500, admission: 5000 } }, heads);
    const tuition = lines.find((l) => l.headId === "tuition");
    assert.equal(tuition.amount, 3000);
    assert.equal(discount, 300); // 10% of the discountable tuition line only
  });
  test("a term head only appears in its billed months", () => {
    const october = voucherLines(student, "2026-10", { amounts: { exam: 500 } }, heads).lines;
    assert.ok(october.some((l) => l.headId === "exam"));
    const november = voucherLines(student, "2026-11", { amounts: { exam: 500 } }, heads).lines;
    assert.ok(!november.some((l) => l.headId === "exam"));
  });
  test("a one-time head only appears in the admission month", () => {
    const admissionMonth = voucherLines(student, "2026-10", { amounts: { admission: 5000 } }, heads).lines;
    assert.ok(admissionMonth.some((l) => l.headId === "admission"));
    const laterMonth = voucherLines({ ...student, admissionDate: "2025-01-01" }, "2026-10", { amounts: { admission: 5000 } }, heads).lines;
    assert.ok(!laterMonth.some((l) => l.headId === "admission"));
  });
});

describe("feeStanding", () => {
  test("no unpaid vouchers is clear", () => {
    const standing = feeStanding([{ totalAmount: 3000, paidAmount: 3000, status: "paid" }]);
    assert.deepEqual(standing, { balance: 0, feeStatus: "clear" });
  });
  test("exactly one unpaid voucher is pending", () => {
    const standing = feeStanding([
      { totalAmount: 3000, paidAmount: 3000, status: "paid" },
      { totalAmount: 3000, paidAmount: 0, status: "unpaid" },
    ]);
    assert.deepEqual(standing, { balance: 3000, feeStatus: "pending" });
  });
  test("two or more unpaid vouchers make a defaulter", () => {
    const standing = feeStanding([
      { totalAmount: 3000, paidAmount: 0, status: "unpaid" },
      { totalAmount: 3000, paidAmount: 1000, status: "partial" },
    ]);
    assert.deepEqual(standing, { balance: 5000, feeStatus: "defaulter" });
  });
});

describe("buildVoucherNumber", () => {
  test("encodes the billing month and the student's roll number", () => assert.equal(buildVoucherNumber("2026-10", "STD-1042"), "VCH-2610-1042"));
});
