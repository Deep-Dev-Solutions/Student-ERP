// Phase 4 end-to-end tests: staff directory, status/termination (and its cascade into
// allocations and section incharges), and subject-to-section teacher allocations.
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

describe("staff: directory and module gating", () => {
  test("the demo school has staff and teachers", async () => {
    const owner = await signIn("tayyab@erp.com");
    const staff = await owner.get("/api/staff");
    assert.ok(staff.body.some((m) => m.staffId === "STF-201"));
    const teachers = await owner.get("/api/staff/teachers");
    assert.ok(teachers.body.some((t) => t.id === "STF-201"));
    assert.ok(!teachers.body.some((t) => t.id === "STF-206")); // terminated, shouldn't be offered
  });

  test("a school without the Staff module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/staff");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Staff and HR isn't part of your plan");
  });
});

describe("staff: onboarding", () => {
  test("a duplicate email or CNIC is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const dupEmail = await owner.put("/api/staff").send({
      name: "Test Person", email: "tariq.mahmood@school.edu.pk", phone: "0300-0000000", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-1", gender: "male", employment: "permanent", teaches: true,
      basicSalary: 50000, allowances: [],
    });
    assert.equal(dupEmail.status, 409, dupEmail.text);

    const dupCnic = await owner.put("/api/staff").send({
      name: "Test Person", email: "new.person@school.edu.pk", phone: "0300-0000000", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-1", gender: "male", employment: "permanent", teaches: true,
      basicSalary: 50000, allowances: [], cnic: "35202-1122334-5",
    });
    assert.equal(dupCnic.status, 409, dupCnic.text);
  });

  test("a new staff member is numbered and persisted; a teacher can't onboard staff", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.put("/api/staff").send({
      name: "New Teacher", email: "new.teacher@school.edu.pk", phone: "0300-1111111", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-1", gender: "female", employment: "permanent", teaches: true,
      basicSalary: 60000, allowances: [],
    });
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const created = await owner.put("/api/staff").send({
      name: "New Teacher", email: "new.teacher@school.edu.pk", phone: "0300-1111111", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-1", gender: "female", employment: "permanent", teaches: true,
      basicSalary: 60000, allowances: [{ label: "House rent", amount: 15000 }],
    });
    assert.equal(created.status, 200, created.text);
    assert.match(created.body.staffId, /^STF-\d+$/);
    assert.equal((await owner.get("/api/staff")).body.filter((m) => m.email === "new.teacher@school.edu.pk").length, 1);
  });
});

describe("staff: status and termination", () => {
  test("terminating requires a leaving date and reason", async () => {
    const owner = await signIn("tayyab@erp.com");
    const member = (await owner.get("/api/staff")).body.find((m) => m.staffId === "STF-207");
    const missing = await owner.post(`/api/staff/${member.id}/status`).send({ status: "terminated" });
    assert.equal(missing.status, 400);
  });

  test("terminating a teacher frees their allocations and any section they're incharge of", async () => {
    const owner = await signIn("tayyab@erp.com");
    const member = (await owner.get("/api/staff")).body.find((m) => m.staffId === "STF-207"); // Bilal Ahmed, teaches maths
    await system.query("UPDATE section SET incharge_id = $1 WHERE id = $2", ["STF-207", "br-1-9-A"]);

    const before = (await owner.get("/api/allocations")).body.filter((a) => a.teacherId === "STF-207");
    assert.ok(before.length > 0);

    const res = await owner.post(`/api/staff/${member.id}/status`).send({ status: "terminated", date: "2026-10-23", reason: "Resigned" });
    assert.equal(res.status, 201, res.text);

    const after = (await owner.get("/api/allocations")).body.filter((a) => a.teacherId === "STF-207");
    assert.equal(after.length, 0);
    const { rows } = await system.query("SELECT incharge_id FROM section WHERE id = $1", ["br-1-9-A"]);
    assert.equal(rows[0].incharge_id, null);

    const teachers = await owner.get("/api/staff/teachers");
    assert.ok(!teachers.body.some((t) => t.id === "STF-207"));
  });
});

describe("staff: teacher allocations", () => {
  test("only acad_manage_allocations can set an allocation", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: "STF-202", weeklyPeriods: 6 });
    assert.equal(denied.status, 403);
  });

  test("a non-teacher or terminated teacher can't be allocated", async () => {
    const owner = await signIn("tayyab@erp.com");
    const nonTeacher = await owner.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: "STF-211", weeklyPeriods: 6 });
    assert.equal(nonTeacher.status, 400);

    const terminated = await owner.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: "STF-206", weeklyPeriods: 6 });
    assert.equal(terminated.status, 400);
  });

  test("weekly periods must be within range", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: "STF-202", weeklyPeriods: 15 });
    assert.equal(res.status, 400);
  });

  test("setting an allocation then clearing it with teacherId null removes it", async () => {
    const owner = await signIn("tayyab@erp.com");
    const set = await owner.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: "STF-202", weeklyPeriods: 6 });
    assert.equal(set.status, 200, set.text);
    assert.ok((await owner.get("/api/allocations")).body.some((a) => a.sectionId === "br-1-8-C" && a.subjectId === "sub-math"));

    const cleared = await owner.put("/api/allocations").send({ classId: "br-1-8", sectionId: "br-1-8-C", subjectId: "sub-math", teacherId: null });
    assert.equal(cleared.status, 200, cleared.text);
    assert.ok(!(await owner.get("/api/allocations")).body.some((a) => a.sectionId === "br-1-8-C" && a.subjectId === "sub-math"));
  });
});

describe("staff: row-level security", () => {
  test("one school's staff are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'staff') WHERE id = 't-3' AND NOT ('staff' = ANY(modules))");
    const owner2 = await signIn("kashif@scholarshub.pk");
    const created = await owner2.put("/api/staff").send({
      name: "Isolation Person", email: "isolation@school.edu.pk", phone: "0300-9999999", role: "Teacher", department: "Science",
      joinDate: "2026-01-01", status: "active", branchId: "br-t3", gender: "male", employment: "permanent", teaches: true,
      basicSalary: 50000, allowances: [],
    });
    assert.equal(created.status, 200, created.text);

    const owner1 = await signIn("tayyab@erp.com");
    const staff = await owner1.get("/api/staff");
    assert.ok(!staff.body.some((m) => m.email === "isolation@school.edu.pk"));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'staff') WHERE id = 't-3'");
  });
});
