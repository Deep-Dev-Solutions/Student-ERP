// Phase 8 end-to-end tests: the teacher portal's "today" endpoint. pendingTasks is
// computed from real data (unmarked attendance, ungraded exam marks); todayClasses
// stays empty since nothing in this project tracks a real period-by-period schedule.
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

describe("teacher day", () => {
  test("todayClasses is always empty; there's no real timetable to report", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.get("/api/teacher/day");
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.body.todayClasses, []);
  });

  test("a signed-in member with no staff record gets an empty, zeroed-out day", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/teacher/day");
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.body, { todayClasses: [], pendingTasks: [], teacherSummary: { name: "Tayyab Saeed", students: 0 } });
  });

  test("a teacher who is incharge of a section with no register for today gets an attendance task", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com"); // STF-201, incharge of br-1-10-A
    const res = await teacher.get("/api/teacher/day");
    assert.equal(res.status, 200, res.text);
    const attendance = res.body.pendingTasks.filter((t) => t.type === "attendance");
    assert.ok(attendance.some((t) => t.id === "task-att-br-1-10-A"));
    for (const t of attendance) {
      assert.equal(t.urgency, "high");
      assert.equal(t.actionHref, "/teacher-portal/attendance");
    }
  });

  test("a teacher with unmarked exam papers gets marks tasks, one per class they teach it to", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com"); // teaches Physics to 9-B, 10-A and 10-B
    const res = await teacher.get("/api/teacher/day");
    const marks = res.body.pendingTasks.filter((t) => t.type === "marks");
    assert.ok(marks.length > 0);
    const ids = new Set(marks.map((t) => t.id));
    assert.equal(ids.size, marks.length); // no duplicate (classId, subjectId) tasks despite several section allocations
    for (const t of marks) {
      assert.ok(["high", "medium"].includes(t.urgency));
      assert.equal(t.actionHref, "/teacher-portal/marks");
      assert.match(t.description, /answer sheets? left/);
    }
  });

  test("teacherSummary reports the teacher's real name and taught student count", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.get("/api/teacher/day");
    assert.equal(res.body.teacherSummary.name, "Dr. Tariq Mahmood");
    assert.ok(res.body.teacherSummary.students > 0);
  });

  test("a staff member with no allocations and no incharge section has no pending tasks", async () => {
    const accountant = await signIn("ali@erp.com"); // STF-212, Accountant, doesn't teach
    const res = await accountant.get("/api/teacher/day");
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.body.pendingTasks, []);
    assert.equal(res.body.teacherSummary.students, 0);
    assert.equal(res.body.teacherSummary.name, "Ali Raza");
  });
});
