// Phase 2 end-to-end tests: attendance registers, locking and reopening, unlock
// requests, absence alerts and staff attendance.
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

const sample = (sectionId, classId, date) => ({
  branchId: "br-1",
  classId,
  sectionId,
  date,
  marks: { "STD-1042": { status: "present" }, "STD-1044": { status: "absent" } },
});

describe("attendance: directory and seeded history", () => {
  test("the demo school has registers, a pending unlock request and staff attendance", async () => {
    const owner = await signIn("tayyab@erp.com");
    const registers = await owner.get("/api/registers");
    assert.equal(registers.status, 200);
    assert.ok(registers.body.length > 0);
    const unlocks = await owner.get("/api/unlock-requests");
    assert.equal(unlocks.status, 200);
    assert.ok(unlocks.body.some((u) => u.status === "pending"));
    const staff = await owner.get("/api/staff-attendance");
    assert.equal(staff.status, 200);
    assert.ok(staff.body.length > 0);
  });

  test("a school without the Attendance module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/registers");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Attendance isn't part of your plan");
  });
});

describe("attendance: submitting and locking a register", () => {
  test("submitRegister validates the marks shape", async () => {
    const owner = await signIn("tayyab@erp.com");
    const bad = { ...sample("br-1-9-C", "br-1-9", "2026-10-20"), marks: { "STD-1046": { status: "late" } } };
    const res = await owner.put("/api/registers").send(bad);
    assert.equal(res.status, 400);
  });

  test("an owner submits a new register, then locking blocks resubmission until reopened", async () => {
    const owner = await signIn("tayyab@erp.com");
    const input = sample("br-1-9-C", "br-1-9", "2026-10-20");
    const created = await owner.put("/api/registers").send(input);
    assert.equal(created.status, 200, created.text);
    assert.equal(created.body.id, "br-1-9-C:2026-10-20");
    assert.equal(created.body.marks["STD-1044"].status, "absent");

    const lock = await owner.post("/api/registers/lock").send([created.body.id]);
    assert.equal(lock.status, 201);
    const blocked = await owner.put("/api/registers").send({ ...input, marks: { ...input.marks, "STD-1042": { status: "absent" } } });
    assert.equal(blocked.status, 409);

    const reopen = await owner.post(`/api/registers/${created.body.id}/unlock`).send({ reason: "Parent brought a late note the next morning." });
    assert.equal(reopen.status, 201, reopen.text);

    const resubmitted = await owner.put("/api/registers").send({ ...input, marks: { ...input.marks, "STD-1042": { status: "absent" } } });
    assert.equal(resubmitted.status, 200);
    assert.ok(resubmitted.body.lockedAt, "resubmitting a reopened register locks it again");
    assert.ok(resubmitted.body.changes.some((c) => c.studentId === "STD-1042" && c.from === "present" && c.to === "absent"));
  });

  test("unlockRegister needs a real reason and requires att_lock_roster", async () => {
    const owner = await signIn("tayyab@erp.com");
    const id = "br-1-9-C:2026-10-20";
    const tooShort = await owner.post(`/api/registers/${id}/unlock`).send({ reason: "no" });
    assert.equal(tooShort.status, 400);
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.post(`/api/registers/${id}/unlock`).send({ reason: "Needs a correction after review." });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your role can't do this");
  });
});

describe("attendance: who may mark a register (class_incharge mode)", () => {
  test("the section's class incharge can mark it", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com"); // STF-201, incharge of br-1-10-A
    const res = await teacher.put("/api/registers").send(sample("br-1-10-A", "br-1-10", "2026-10-21"));
    assert.equal(res.status, 200, res.text);
  });

  test("a teacher who isn't the incharge is refused with a clear reason", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com"); // not the incharge of br-1-9-A (that's STF-203)
    const res = await teacher.put("/api/registers").send(sample("br-1-9-A", "br-1-9", "2026-10-21"));
    assert.equal(res.status, 403);
    assert.match(res.body.message, /class incharge/);
  });

  test("front desk can mark any section under att_mark_daily, an accountant without it cannot", async () => {
    const frontDesk = await signIn("sana@erp.com");
    const ok = await frontDesk.put("/api/registers").send(sample("br-1-9-B", "br-1-9", "2026-10-21"));
    assert.equal(ok.status, 200, ok.text);

    const accountant = await signIn("ali@erp.com");
    const blocked = await accountant.put("/api/registers").send(sample("br-1-9-D", "br-1-9", "2026-10-21"));
    assert.equal(blocked.status, 403);
    assert.match(blocked.body.message, /role can't mark/);
  });

  test("a branch admin can always mark, regardless of incharge", async () => {
    const admin = await signIn("usman@erp.com");
    const res = await admin.put("/api/registers").send(sample("br-1-9-A", "br-1-9", "2026-10-22"));
    assert.equal(res.status, 200, res.text);
  });
});

describe("attendance: unlock requests", () => {
  test("requesting twice while one is pending is refused", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const registerId = "br-1-10-A:2026-10-21";
    const first = await teacher.post("/api/unlock-requests").send({ registerId, reason: "Need to correct one student's mark." });
    assert.equal(first.status, 201, first.text);
    const second = await teacher.post("/api/unlock-requests").send({ registerId, reason: "Still need the same correction." });
    assert.equal(second.status, 409);
  });

  test("approving a request reopens the register; declining leaves it as is", async () => {
    const owner = await signIn("tayyab@erp.com");
    const pending = (await owner.get("/api/unlock-requests")).body.find((u) => u.registerId === "br-1-10-A:2026-10-21" && u.status === "pending");
    assert.ok(pending);
    const approved = await owner.post(`/api/unlock-requests/${pending.id}/decision`).send({ approve: true });
    assert.equal(approved.status, 201);
    const requests = (await owner.get("/api/unlock-requests")).body;
    assert.equal(requests.find((u) => u.id === pending.id).status, "approved");

    const second = await owner.post("/api/unlock-requests").send({ registerId: "br-1-10-A:2026-10-21", reason: "Another small correction needed." });
    const declined = await owner.post(`/api/unlock-requests/${second.body.id}/decision`).send({ approve: false });
    assert.equal(declined.status, 201);
    assert.equal((await owner.get("/api/unlock-requests")).body.find((u) => u.id === second.body.id).status, "declined");
    assert.equal((await owner.post(`/api/unlock-requests/${second.body.id}/decision`).send({ approve: true })).status, 404);
  });
});

describe("attendance: alerts and staff attendance", () => {
  test("markAlertsSent needs att_send_alerts and records the timestamp", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/registers/alerts").send(["br-1-10-A:2026-10-21"]);
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/registers/alerts").send(["br-1-10-A:2026-10-21"]);
    assert.equal(res.status, 201);
    const register = (await owner.get("/api/registers")).body.find((r) => r.id === "br-1-10-A:2026-10-21");
    assert.ok(register.alertsSentAt);
  });

  test("saveStaffAttendance validates statuses and needs att_mark_daily", async () => {
    const owner = await signIn("tayyab@erp.com");
    const bad = await owner.put("/api/staff-attendance/2026-10-21").send({ branchId: "br-1", marks: { "STF-201": "napping" } });
    assert.equal(bad.status, 400);
    const ok = await owner.put("/api/staff-attendance/2026-10-21").send({ branchId: "br-1", marks: { "STF-201": "present", "STF-202": "late" } });
    assert.equal(ok.status, 200, ok.text);
    assert.equal(ok.body.id, "br-1:2026-10-21");
    // Saving again for the same day replaces the marks (upsert), not duplicates the row.
    const again = await owner.put("/api/staff-attendance/2026-10-21").send({ branchId: "br-1", marks: { "STF-201": "absent" } });
    assert.equal(again.status, 200);
    const { rows } = await system.query("SELECT count(*)::int n FROM staff_attendance_day WHERE id = 'br-1:2026-10-21'");
    assert.equal(rows[0].n, 1);

    const accountant = await signIn("ali@erp.com");
    assert.equal((await accountant.put("/api/staff-attendance/2026-10-21").send({ branchId: "br-1", marks: {} })).status, 403);
  });

  test("a member scoped to one campus can't mark attendance for another", async () => {
    const branchAdmin = await signIn("usman@erp.com"); // branchIds: ["br-1"]
    const res = await branchAdmin.put("/api/staff-attendance/2026-10-21").send({ branchId: "br-2", marks: {} });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "That campus isn't assigned to you");
  });
});

describe("attendance: row-level security", () => {
  test("one school's registers are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'attendance') WHERE id = 't-2' AND NOT ('attendance' = ANY(modules))");
    const owner2 = await signIn("rabia@brightfuture.pk");
    const cls = await owner2.post("/api/classes").send({ branchId: "br-t2", name: "Isolation Class", order: 1 });
    const section = await owner2.post("/api/sections").send({ classId: cls.body.id, name: "Z", shift: "morning", capacity: 30 });
    const submitted = await owner2.put("/api/registers").send({ branchId: "br-t2", classId: cls.body.id, sectionId: section.body.id, date: "2026-10-21", marks: {} });
    assert.equal(submitted.status, 200, submitted.text);

    const owner1 = await signIn("tayyab@erp.com");
    const registers = await owner1.get("/api/registers");
    assert.ok(!registers.body.some((r) => r.id === submitted.body.id));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'attendance') WHERE id = 't-2'");
  });
});
