// Phase 8 end-to-end tests: admin dashboard figures, computed for real from
// registers, vouchers/payments and students (the 12 reports need no backend
// endpoints at all — they're pure client-side reads of already-migrated data).
import "reflect-metadata";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import request from "supertest";

const require = createRequire(import.meta.url);
const { createApp } = require("../../dist/bootstrap.js");

const PASSWORD = "deepdev123";
let app;
let server;

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
});

after(async () => {
  await app.close();
});

describe("dashboard: module gating", () => {
  test("a school with none of the relevant modules is refused everywhere", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    for (const [path, moduleName] of [
      ["/dashboard/register-summary", "Attendance"],
      ["/dashboard/attendance-trend", "Attendance"],
      ["/dashboard/fee-target", "Fees"],
      ["/dashboard/fee-collection", "Fees"],
      ["/dashboard/students-summary", "Students and admissions"],
    ]) {
      const res = await owner.get(`/api${path}`);
      assert.equal(res.status, 403, path);
      assert.equal(res.body.message, `${moduleName} isn't part of your plan`, path);
    }
  });

  test("a school with fees and students but not attendance is refused only the attendance widgets", async () => {
    const owner = await signIn("rabia@brightfuture.pk");
    assert.equal((await owner.get("/api/dashboard/register-summary")).status, 403);
    assert.equal((await owner.get("/api/dashboard/attendance-trend")).status, 403);
    assert.equal((await owner.get("/api/dashboard/fee-target")).status, 200);
    assert.equal((await owner.get("/api/dashboard/fee-collection")).status, 200);
    assert.equal((await owner.get("/api/dashboard/students-summary")).status, 200);
  });
});

describe("dashboard: real figures for the demo school", () => {
  test("register summary's section counts add up, and present never exceeds enrolled", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/dashboard/register-summary");
    assert.equal(res.status, 200, res.text);
    const s = res.body;
    assert.equal(s.locked + s.pending + s.notMarked, s.sections);
    assert.ok(s.sections > 0);
    assert.ok(s.present <= s.enrolledInMarked);
    if (s.enrolledInMarked > 0) assert.equal(s.rate, Math.round((s.present / s.enrolledInMarked) * 1000) / 10);
    else assert.equal(s.rate, 0);
  });

  test("the attendance trend is at most 22 real school days, each a sane rate", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/dashboard/attendance-trend");
    assert.equal(res.status, 200, res.text);
    assert.ok(res.body.length > 0);
    assert.ok(res.body.length <= 22);
    for (const day of res.body) {
      assert.equal(typeof day.date, "string");
      assert.ok(day.rate >= 0 && day.rate <= 100);
    }
  });

  test("fee target reports this month's real collections, target and overdue standing", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/dashboard/fee-target");
    assert.equal(res.status, 200, res.text);
    assert.equal(typeof res.body.month, "string");
    assert.ok(res.body.month.length > 0);
    for (const key of ["collected", "target", "overdueAmount", "overdueVouchers"]) assert.ok(res.body[key] >= 0, key);
  });

  test("fee collection covers the last 7 calendar months, the current one flagged", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/dashboard/fee-collection");
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.length, 7);
    assert.equal(res.body.at(-1).current, true);
    assert.ok(res.body.slice(0, -1).every((m) => !m.current));
    for (const m of res.body) assert.ok(m.collected >= 0);
  });

  test("students summary counts active students at the campus", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/dashboard/students-summary");
    assert.equal(res.status, 200, res.text);
    assert.ok(res.body.total > 0);
    assert.ok(res.body.admittedThisMonth >= 0 && res.body.admittedThisMonth <= res.body.total);
  });
});
