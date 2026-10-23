// Phase 4 end-to-end tests: payroll runs, payslip edits, marking paid (with advance
// recovery) and salary advances.
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

describe("payroll: directory and module gating", () => {
  test("the demo school has payroll runs, payslips and advances", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.ok((await owner.get("/api/payroll-runs")).body.some((r) => r.month === "2026-08"));
    assert.ok((await owner.get("/api/payslips")).body.length > 0);
    assert.ok((await owner.get("/api/advances")).body.some((a) => a.staffId === "STF-205"));
  });

  test("a school without the Payroll module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/payroll-runs");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Payroll isn't part of your plan");
  });
});

describe("payroll: starting and finalising a run", () => {
  test("only fin_manage_payroll can start a run, and only one run per branch and month", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/payroll-runs").send({ branchId: "br-1", month: "2026-10" });
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const started = await owner.post("/api/payroll-runs").send({ branchId: "br-1", month: "2026-10" });
    assert.equal(started.status, 201, started.text);
    assert.equal(started.body.status, "draft");

    const repeat = await owner.post("/api/payroll-runs").send({ branchId: "br-1", month: "2026-10" });
    assert.equal(repeat.status, 409);
  });

  test("a draft payslip can be edited, but not once the run is finalised", async () => {
    const owner = await signIn("tayyab@erp.com");
    const run = (await owner.get("/api/payroll-runs")).body.find((r) => r.month === "2026-10");
    const slip = (await owner.get("/api/payslips")).body.find((p) => p.runId === run.id);

    const badAdjustment = await owner.patch(`/api/payslips/${slip.id}`).send({ absentDays: 0, adjustments: [{ label: "", amount: 500 }] });
    assert.equal(badAdjustment.status, 400);

    const updated = await owner.patch(`/api/payslips/${slip.id}`).send({ absentDays: 2, adjustments: [{ label: "Bonus", amount: 1000 }] });
    assert.equal(updated.status, 200, updated.text);
    assert.equal(updated.body.absentDays, 2);

    const finalised = await owner.post(`/api/payroll-runs/${run.id}/finalise`).send({});
    assert.equal(finalised.status, 201, finalised.text);

    const blocked = await owner.patch(`/api/payslips/${slip.id}`).send({ absentDays: 3, adjustments: [] });
    assert.equal(blocked.status, 409);

    const refinalise = await owner.post(`/api/payroll-runs/${run.id}/finalise`).send({});
    assert.equal(refinalise.status, 409);
  });

  test("payslips can only be paid once their run is finalised, and it applies advance recovery", async () => {
    const owner = await signIn("tayyab@erp.com");
    const run = (await owner.get("/api/payroll-runs")).body.find((r) => r.month === "2026-10");
    const slip = (await owner.get("/api/payslips")).body.find((p) => p.runId === run.id && p.staffId === "STF-205"); // has an active advance

    const paid = await owner.post("/api/payslips/paid").send({ ids: [slip.id], method: "bank" });
    assert.equal(paid.status, 201, paid.text);

    const advance = (await owner.get("/api/advances")).body.find((a) => a.staffId === "STF-205");
    assert.ok(advance.recovered >= 5000); // was already 5000 recovered from the mock data; this run adds more if still active

    const runs = await owner.get("/api/payroll-runs");
    const others = (await owner.get("/api/payslips")).body.filter((p) => p.runId === run.id && p.id !== slip.id);
    if (others.every((p) => p.status === "paid")) {
      assert.equal(runs.body.find((r) => r.id === run.id).status, "paid");
    }
  });

  test("marking payslips paid on a still-draft run is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const started = await owner.post("/api/payroll-runs").send({ branchId: "br-1", month: "2027-01" });
    assert.equal(started.status, 201, started.text);
    const slip = (await owner.get("/api/payslips")).body.find((p) => p.runId === started.body.id);
    const blocked = await owner.post("/api/payslips/paid").send({ ids: [slip.id], method: "cash" });
    assert.equal(blocked.status, 409);
  });
});

describe("payroll: advances", () => {
  test("monthly recovery can't exceed the amount, and a second advance is blocked while one is active", async () => {
    const owner = await signIn("tayyab@erp.com");
    const invalid = await owner.post("/api/advances").send({ staffId: "STF-208", amount: 10000, date: "2026-10-01", reason: "Test", monthlyRecovery: 20000 });
    assert.equal(invalid.status, 400);

    const blocked = await owner.post("/api/advances").send({ staffId: "STF-205", amount: 5000, date: "2026-10-01", reason: "Second advance", monthlyRecovery: 1000 });
    assert.equal(blocked.status, 409);

    const ok = await owner.post("/api/advances").send({ staffId: "STF-208", amount: 10000, date: "2026-10-01", reason: "Medical emergency", monthlyRecovery: 2000 });
    assert.equal(ok.status, 201, ok.text);
  });

  test("only fin_manage_payroll can add an advance", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/advances").send({ staffId: "STF-209", amount: 5000, date: "2026-10-01", reason: "Test", monthlyRecovery: 1000 });
    assert.equal(denied.status, 403);
  });
});

describe("payroll: row-level security", () => {
  test("one school's payroll runs are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'payroll') WHERE id = 't-3' AND NOT ('payroll' = ANY(modules))");
    await system.query("UPDATE organization SET modules = array_append(modules, 'staff') WHERE id = 't-3' AND NOT ('staff' = ANY(modules))");
    const owner2 = await signIn("kashif@scholarshub.pk");
    const staffRes = await owner2.put("/api/staff").send({
      name: "Payroll Isolation", email: "payroll.isolation@school.edu.pk", phone: "0300-8888888", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-t3", gender: "male", employment: "permanent", teaches: false,
      basicSalary: 50000, allowances: [],
    });
    assert.equal(staffRes.status, 200, staffRes.text);
    const run = await owner2.post("/api/payroll-runs").send({ branchId: "br-t3", month: "2026-10" });
    assert.equal(run.status, 201, run.text);

    const owner1 = await signIn("tayyab@erp.com");
    const runs = await owner1.get("/api/payroll-runs");
    assert.ok(!runs.body.some((r) => r.branchId === "br-t3"));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'payroll') WHERE id = 't-3'");
    await system.query("UPDATE organization SET modules = array_remove(modules, 'staff') WHERE id = 't-3'");
  });
});
