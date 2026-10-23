// Phase 5 end-to-end tests: exams, date sheets, marks entry and publishing results.
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

describe("exams: directory and module gating", () => {
  test("the demo school has exams, date sheets and marks", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.ok((await owner.get("/api/exams")).body.some((e) => e.id === "ex-1"));
    assert.ok((await owner.get("/api/exam-papers")).body.length > 0);
    assert.ok((await owner.get("/api/exam-marks")).body.length > 0);
  });

  test("a school without the Exams module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/exams");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Exams and results isn't part of your plan");
  });
});

describe("exams: creating and editing", () => {
  test("a duplicate title, or an end date before the start, is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const dup = await owner.put("/api/exams").send({ branchId: "br-1", sessionId: "2026-2027", title: "mid-term exam 2026", termType: "midterm", startDate: "2026-11-01", endDate: "2026-11-10", classIds: ["br-1-9"] });
    assert.equal(dup.status, 409, dup.text);

    const badDates = await owner.put("/api/exams").send({ branchId: "br-1", sessionId: "2026-2027", title: "A new exam", termType: "quiz", startDate: "2026-11-10", endDate: "2026-11-01", classIds: ["br-1-9"] });
    assert.equal(badDates.status, 400);
  });

  test("a teacher can't create an exam, but an owner can", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.put("/api/exams").send({ branchId: "br-1", sessionId: "2026-2027", title: "Weekly Quiz 1", termType: "quiz", startDate: "2026-11-02", endDate: "2026-11-02", classIds: ["br-1-9"] });
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const created = await owner.put("/api/exams").send({ branchId: "br-1", sessionId: "2026-2027", title: "Weekly Quiz 1", termType: "quiz", startDate: "2026-11-02", endDate: "2026-11-02", classIds: ["br-1-9"] });
    assert.equal(created.status, 200, created.text);
    assert.equal(created.body.title, "Weekly Quiz 1");
  });

  test("a published exam can't be edited or deleted", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.id === "ex-2");
    const edited = await owner.put("/api/exams").send({ ...exam, id: "ex-2", title: "Monthly test, renamed" });
    assert.equal(edited.status, 409);
    const deleted = await owner.delete("/api/exams/ex-2");
    assert.equal(deleted.status, 409);
  });

  test("dropping a class that already has marks is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.id === "ex-1");
    const res = await owner.put("/api/exams").send({ ...exam, id: "ex-1", classIds: exam.classIds.filter((c) => c !== "br-1-9") });
    assert.equal(res.status, 409, res.text);
  });

  test("narrowing the dates past existing date-sheet papers is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.id === "ex-1");
    const res = await owner.put("/api/exams").send({ ...exam, id: "ex-1", endDate: "2026-10-15" });
    assert.equal(res.status, 409, res.text);
  });
});

describe("exams: date sheet", () => {
  test("a paper date outside the exam range, or pass marks over the total, is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");
    const outside = await owner.put(`/api/exams/${exam.id}/date-sheet`).send({ classId: "br-1-9", papers: [{ subjectId: "sub-math", date: "2026-11-05", totalMarks: 20, passMarks: 10 }] });
    assert.equal(outside.status, 400);
    const overPass = await owner.put(`/api/exams/${exam.id}/date-sheet`).send({ classId: "br-1-9", papers: [{ subjectId: "sub-math", date: "2026-11-02", totalMarks: 20, passMarks: 25 }] });
    assert.equal(overPass.status, 400);
  });

  test("only acad_create_exam can set a date sheet; a valid one is saved", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.put("/api/exams/ex-1/date-sheet").send({ classId: "br-1-9", papers: [] });
    assert.equal(denied.status, 403);

    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");
    const saved = await owner.put(`/api/exams/${exam.id}/date-sheet`).send({ classId: "br-1-9", papers: [{ subjectId: "sub-math", date: "2026-11-02", totalMarks: 20, passMarks: 10 }] });
    assert.equal(saved.status, 200, saved.text);
    assert.equal(saved.body.length, 1);
    assert.ok((await owner.get("/api/exam-papers")).body.some((p) => p.examId === exam.id && p.subjectId === "sub-math"));
  });

  test("shrinking a subject's total below a mark already entered is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    // ex-1/br-1-9: sub-eng, sub-urdu and sub-math already have marks up to 71, 71 and 65 out of 75.
    const res = await owner.put("/api/exams/ex-1/date-sheet").send({
      classId: "br-1-9",
      papers: [
        { subjectId: "sub-eng", date: "2026-10-12", totalMarks: 50, passMarks: 25 },
        { subjectId: "sub-urdu", date: "2026-10-13", totalMarks: 75, passMarks: 38 },
        { subjectId: "sub-math", date: "2026-10-14", totalMarks: 75, passMarks: 38 },
      ],
    });
    assert.equal(res.status, 409, res.text);
  });

  test("taking a marked subject off the date sheet is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.put("/api/exams/ex-1/date-sheet").send({
      classId: "br-1-9",
      papers: [
        { subjectId: "sub-eng", date: "2026-10-12", totalMarks: 75, passMarks: 38 },
        { subjectId: "sub-urdu", date: "2026-10-13", totalMarks: 75, passMarks: 38 },
      ],
    });
    assert.equal(res.status, 409, res.text);
  });
});

describe("exams: marks entry", () => {
  test("marks must be within range and in half-mark steps", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");
    const student = (await owner.get("/api/students")).body.find((s) => s.classId === "br-1-9" && s.enrollment === "active");

    const tooHigh = await owner.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: student.id, obtained: 25, absent: false }] });
    assert.equal(tooHigh.status, 400);

    const notHalf = await owner.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: student.id, obtained: 3.3, absent: false }] });
    assert.equal(notHalf.status, 400);

    const wrongClass = await owner.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: "STD-1043", obtained: 10, absent: false }] });
    assert.equal(wrongClass.status, 400);
  });

  test("a teacher with acad_enter_marks can save marks; a front desk officer can't", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const exam = (await teacher.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");
    const student = (await teacher.get("/api/students")).body.find((s) => s.classId === "br-1-9" && s.enrollment === "active");
    const saved = await teacher.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: student.id, obtained: 15.5, absent: false, remark: "Good effort" }] });
    assert.equal(saved.status, 200, saved.text);
    assert.equal(saved.body[0].obtained, 15.5);

    const frontDesk = await signIn("sana@erp.com");
    const denied = await frontDesk.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: student.id, obtained: 10, absent: false }] });
    assert.equal(denied.status, 403);
  });

  test("marks are locked once results are published", async () => {
    const owner = await signIn("tayyab@erp.com");
    const student = (await owner.get("/api/students")).body.find((s) => s.classId === "br-1-9" && s.enrollment === "active");
    const res = await owner.put("/api/exam-marks").send({ examId: "ex-2", subjectId: "sub-eng", entries: [{ studentId: student.id, obtained: 10, absent: false }] });
    assert.equal(res.status, 409);
  });
});

describe("exams: publishing results", () => {
  test("only acad_lock_gradebook can publish, and publishing locks everything", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");

    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post(`/api/exams/${exam.id}/publish`).send({ published: true });
    assert.equal(denied.status, 403);

    const published = await owner.post(`/api/exams/${exam.id}/publish`).send({ published: true });
    assert.equal(published.status, 201, published.text);

    const lockedMarks = await owner.put("/api/exam-marks").send({ examId: exam.id, subjectId: "sub-math", entries: [{ studentId: "STD-1042", obtained: 10, absent: false }] });
    assert.equal(lockedMarks.status, 409);
    const lockedSheet = await owner.put(`/api/exams/${exam.id}/date-sheet`).send({ classId: "br-1-9", papers: [] });
    assert.equal(lockedSheet.status, 409);
    const lockedDelete = await owner.delete(`/api/exams/${exam.id}`);
    assert.equal(lockedDelete.status, 409);
  });

  test("unpublishing reopens the exam, which can then be deleted", async () => {
    const owner = await signIn("tayyab@erp.com");
    const exam = (await owner.get("/api/exams")).body.find((e) => e.title === "Weekly Quiz 1");
    const unpublished = await owner.post(`/api/exams/${exam.id}/publish`).send({ published: false });
    assert.equal(unpublished.status, 201, unpublished.text);

    const deleted = await owner.delete(`/api/exams/${exam.id}`);
    assert.equal(deleted.status, 200, deleted.text);
    assert.ok(!(await owner.get("/api/exams")).body.some((e) => e.id === exam.id));
    assert.ok(!(await owner.get("/api/exam-papers")).body.some((p) => p.examId === exam.id));
  });
});

describe("exams: row-level security", () => {
  test("one school's exams are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'exams') WHERE id = 't-3' AND NOT ('exams' = ANY(modules))");
    const owner2 = await signIn("kashif@scholarshub.pk");
    const created = await owner2.put("/api/exams").send({ branchId: "br-t3", sessionId: "2026-2027", title: "Isolation Exam", termType: "quiz", startDate: "2026-11-01", endDate: "2026-11-01", classIds: ["br-t3"] });
    assert.equal(created.status, 200, created.text);

    const owner1 = await signIn("tayyab@erp.com");
    const exams = await owner1.get("/api/exams");
    assert.ok(!exams.body.some((e) => e.title === "Isolation Exam"));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'exams') WHERE id = 't-3'");
  });
});
