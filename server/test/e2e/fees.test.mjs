// Phase 3 end-to-end tests: fee heads/plans/concessions, voucher generation and
// cancellation, payments (with idempotency and late-fine waiving), reversals,
// day closing and fee reminders.
import "reflect-metadata";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import pg from "pg";
import request from "supertest";

const require = createRequire(import.meta.url);
const { createApp } = require("../../dist/bootstrap.js");

const PASSWORD = "deepdev123";
let app;
let server;
let system;

async function signIn(email, password = PASSWORD) {
  const agent = request.agent(server);
  const res = await agent.post("/api/auth/sign-in/email").set("origin", "http://localhost:3000").send({ email, password });
  assert.equal(res.status, 200, `sign in ${email}: ${res.text}`);
  return agent;
}

before(async () => {
  app = await createApp();
  await app.init();
  server = app.getHttpServer();
  system = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await system.connect();
});

after(async () => {
  await system.end();
  await app.close();
});

describe("fees: directory and module gating", () => {
  test("the demo school has fee heads, plans, concessions and history", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.ok((await owner.get("/api/fee-heads")).body.some((h) => h.id === "tuition"));
    assert.ok((await owner.get("/api/fee-plans")).body.length > 0);
    assert.ok((await owner.get("/api/concessions")).body.length > 0);
    const vouchers = await owner.get("/api/vouchers");
    assert.ok(vouchers.body.length > 0);
    assert.ok((await owner.get("/api/payments")).body.length > 0);
  });

  test("a school without the Fees module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/fee-heads");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Fees isn't part of your plan");
  });
});

describe("fees: structure", () => {
  test("a duplicate fee head name is refused; tuition can't be removed", async () => {
    const owner = await signIn("tayyab@erp.com");
    const dup = await owner.put("/api/fee-heads").send({ id: "new-head", name: "tuition", frequency: "monthly", termMonths: [], discountable: false });
    assert.equal(dup.status, 409);
    const created = await owner.put("/api/fee-heads").send({ id: "transport", name: "Transport", frequency: "monthly", termMonths: [], discountable: false });
    assert.equal(created.status, 200, created.text);
    assert.equal((await owner.delete("/api/fee-heads/tuition")).status, 400);
    assert.equal((await owner.delete("/api/fee-heads/transport")).status, 200);
  });

  test("fee plan amounts must be whole rupees", async () => {
    const owner = await signIn("tayyab@erp.com");
    const bad = await owner.put("/api/fee-plans").send({ id: "plan-br-1-9", branchId: "br-1", classId: "br-1-9", amounts: { lab: 300.5 } });
    assert.equal(bad.status, 400);
  });

  test("a teacher can't manage fee structure", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.put("/api/concessions").send({ id: "con-new", name: "Test concession", percent: 15 });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your role can't do this");
  });
});

describe("fees: voucher generation and cancellation", () => {
  test("generateVouchers creates a new month's vouchers and skips a student who already has one", async () => {
    const owner = await signIn("tayyab@erp.com");
    const fresh = await owner.post("/api/vouchers/generate").send({ month: "2026-11", dueDate: "2026-11-10", studentIds: ["STD-1042", "STD-1049"] });
    assert.equal(fresh.status, 201, fresh.text);
    assert.equal(fresh.body.created, 2);
    const repeat = await owner.post("/api/vouchers/generate").send({ month: "2026-11", dueDate: "2026-11-10", studentIds: ["STD-1042", "STD-1049"] });
    assert.equal(repeat.status, 201);
    assert.equal(repeat.body.skipped, 2);
  });

  test("cancelVoucher needs a reason and is blocked once a payment exists", async () => {
    const owner = await signIn("tayyab@erp.com");
    const paidVoucher = "vch-2026-08-STD-1042";
    const shortReason = await owner.post(`/api/vouchers/${paidVoucher}/cancel`).send({ reason: "no" });
    assert.equal(shortReason.status, 400);
    const blocked = await owner.post(`/api/vouchers/${paidVoucher}/cancel`).send({ reason: "Entered twice by mistake" });
    assert.equal(blocked.status, 409);
  });
});

describe("fees: recording and reversing payments", () => {
  test("recordPayment validates the amount against what's due", async () => {
    const owner = await signIn("tayyab@erp.com");
    const voucherId = "vch-2026-10-STD-1046"; // Zainab Tariq, half-paid in October
    const tooMuch = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 999999, lateFine: 0 });
    assert.equal(tooMuch.status, 400);
  });

  test("a repeated idempotencyKey returns the same payment instead of charging twice", async () => {
    const owner = await signIn("tayyab@erp.com");
    const voucherId = "vch-2026-10-STD-1046";
    const key = "test-idem-key-1";
    const first = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 500, lateFine: 0, idempotencyKey: key });
    assert.equal(first.status, 201, first.text);
    const second = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 500, lateFine: 0, idempotencyKey: key });
    assert.equal(second.status, 201);
    assert.equal(second.body.id, first.body.id);
    const { rows } = await system.query("SELECT count(*)::int n FROM payment WHERE idempotency_key = $1", [key]);
    assert.equal(rows[0].n, 1);
  });

  test("only a role with fin_waive_fee can pay less than the computed late fine", async () => {
    // STD-1043 (Fatima Ali, defaulter) has an unpaid October voucher, well past its grace period by now.
    const voucherId = "vch-2026-10-STD-1043";
    const accountant = await signIn("ali@erp.com"); // fin_collect_fee: true, fin_waive_fee: false
    const refused = await accountant.post("/api/payments").send({ voucherId, method: "cash", amount: 100, lateFine: 0 });
    assert.equal(refused.status, 403);
    assert.equal(refused.body.message, "Only certain roles can waive the late fine");

    const owner = await signIn("tayyab@erp.com");
    const allowed = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 100, lateFine: 0 });
    assert.equal(allowed.status, 201, allowed.text);
  });

  test("an accountant can pay at least the computed late fine without fin_waive_fee", async () => {
    const accountant = await signIn("ali@erp.com");
    const voucherId = "vch-2026-09-STD-1043";
    // A large fine is always >= whatever the server computed, so this never needs waiving.
    const res = await accountant.post("/api/payments").send({ voucherId, method: "cash", amount: 50, lateFine: 100000 });
    assert.equal(res.status, 201, res.text);
  });

  test("recordPayment updates the student's balance and fee status", async () => {
    const owner = await signIn("tayyab@erp.com");
    const before = (await owner.get("/api/students")).body.find((s) => s.id === "STD-1046");
    assert.ok(before.balance > 0);
    // Pay off the remaining balance on Zainab's October voucher.
    const voucher = (await owner.get("/api/vouchers")).body.find((v) => v.id === "vch-2026-10-STD-1046");
    const remaining = voucher.totalAmount - voucher.paidAmount;
    if (remaining > 0) await owner.post("/api/payments").send({ voucherId: voucher.id, method: "cash", amount: remaining, lateFine: 0 });
    const after = (await owner.get("/api/students")).body.find((s) => s.id === "STD-1046");
    assert.ok(after.balance < before.balance || after.balance === 0);
  });

  test("reversePayment needs a real reason and the matching permission", async () => {
    const owner = await signIn("tayyab@erp.com");
    const voucherId = "vch-2026-10-STD-1049"; // unpaid, pay fresh then reverse
    const payment = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 500, lateFine: 0 });
    assert.equal(payment.status, 201, payment.text);

    const teacher = await signIn("tariq.mahmood@erp.com");
    const deniedByRole = await teacher.post(`/api/payments/${payment.body.id}/reverse`).send({ reason: "Testing reversal permission" });
    assert.equal(deniedByRole.status, 403);

    const tooShort = await owner.post(`/api/payments/${payment.body.id}/reverse`).send({ reason: "oops" });
    assert.equal(tooShort.status, 400);

    const ok = await owner.post(`/api/payments/${payment.body.id}/reverse`).send({ reason: "Recorded against the wrong voucher" });
    assert.equal(ok.status, 201, ok.text);
    assert.equal((await owner.post(`/api/payments/${payment.body.id}/reverse`).send({ reason: "Recorded against the wrong voucher" })).status, 409);
  });
});

describe("fees: day closing", () => {
  test("a day can only be closed once per campus", async () => {
    const owner = await signIn("tayyab@erp.com");
    const first = await owner.post("/api/day-closings").send({ branchId: "br-1", date: "2026-10-01", totals: { cash: 1000 }, cashCounted: 1000 });
    assert.equal(first.status, 201, first.text);
    const second = await owner.post("/api/day-closings").send({ branchId: "br-1", date: "2026-10-01", totals: { cash: 1000 }, cashCounted: 1000 });
    assert.equal(second.status, 409);
  });

  test("a closed day blocks reversing that day's payments", async () => {
    const owner = await signIn("tayyab@erp.com");
    const voucherId = "vch-2026-10-STD-1051";
    const payment = await owner.post("/api/payments").send({ voucherId, method: "cash", amount: 200, lateFine: 0 });
    assert.equal(payment.status, 201, payment.text);
    await system.query("UPDATE payment SET at = now() WHERE id = $1", [payment.body.id]);
    await owner.post("/api/day-closings").send({ branchId: "br-1", date: new Date().toISOString().slice(0, 10), totals: { cash: 200 }, cashCounted: 200 }).catch(() => {});
    const reversed = await owner.post(`/api/payments/${payment.body.id}/reverse`).send({ reason: "Testing day-close block" });
    assert.equal(reversed.status, 409);
  });
});

describe("fees: reminders", () => {
  test("sendFeeReminders needs fin_send_sms and records a reminder", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/fee-reminders").send(["STD-1043"]);
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/fee-reminders").send(["STD-1043"]);
    assert.equal(res.status, 201);
    assert.ok((await owner.get("/api/fee-reminders")).body.some((r) => r.studentId === "STD-1043"));
  });
});

describe("fees: row-level security", () => {
  test("one school's vouchers are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'fees') WHERE id = 't-3' AND NOT ('fees' = ANY(modules))");
    const owner2 = await signIn("kashif@scholarshub.pk");
    const head = await owner2.put("/api/fee-heads").send({ id: "isolation-head", name: "Isolation Head", frequency: "monthly", termMonths: [], discountable: false });
    assert.equal(head.status, 200, head.text);

    const owner1 = await signIn("tayyab@erp.com");
    const heads = await owner1.get("/api/fee-heads");
    assert.ok(!heads.body.some((h) => h.id === "isolation-head"));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'fees') WHERE id = 't-3'");
  });
});
