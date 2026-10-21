// Phase 1 end-to-end tests: academics (classes, sections, subjects) and students
// (admission, import, section moves, transfer, electives, withdrawal, guardians,
// documents), row-level security, module gating and permissions.
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

describe("academics: classes, sections and subjects", () => {
  test("a class is added, duplicated names are refused, and its sections must go first", async () => {
    const owner = await signIn("tayyab@erp.com");
    const created = await owner.post("/api/classes").send({ branchId: "br-1", name: "Class 11", order: 11, stage: "Intermediate" });
    assert.equal(created.status, 201);
    const dup = await owner.post("/api/classes").send({ branchId: "br-1", name: "class 11", order: 11 });
    assert.equal(dup.status, 409);

    const section = await owner.post("/api/sections").send({ classId: created.body.id, name: "A", shift: "morning", capacity: 30 });
    assert.equal(section.status, 201);
    const dupSection = await owner.post("/api/sections").send({ classId: created.body.id, name: "a", shift: "evening", capacity: 20 });
    assert.equal(dupSection.status, 409);

    const blocked = await owner.delete(`/api/classes/${created.body.id}`);
    assert.equal(blocked.status, 409);
    await owner.patch(`/api/sections/${section.body.id}`).send({ capacity: 35 });
    assert.equal((await owner.get("/api/sections")).body.find((s) => s.id === section.body.id).capacity, 35);
    await owner.delete(`/api/sections/${section.body.id}`);
    assert.equal((await owner.delete(`/api/classes/${created.body.id}`)).status, 200);
  });

  test("a subject can't repeat by name or code, and class-subject offerings toggle", async () => {
    const owner = await signIn("tayyab@erp.com");
    const created = await owner.post("/api/subjects").send({ name: "Economics", code: "ECO" });
    assert.equal(created.status, 201);
    assert.equal((await owner.post("/api/subjects").send({ name: "economics", code: "ECO2" })).status, 409);
    assert.equal((await owner.post("/api/subjects").send({ name: "Something else", code: "eco" })).status, 409);

    const set = await owner.put("/api/class-subjects").send({ classId: "br-1-9", subjectId: created.body.id, offered: true, elective: true });
    assert.equal(set.status, 200);
    assert.ok((await owner.get("/api/class-subjects")).body.some((cs) => cs.classId === "br-1-9" && cs.subjectId === created.body.id));
    await owner.put("/api/class-subjects").send({ classId: "br-1-9", subjectId: created.body.id, offered: false, elective: false });
    assert.ok(!(await owner.get("/api/class-subjects")).body.some((cs) => cs.classId === "br-1-9" && cs.subjectId === created.body.id));
    await owner.delete(`/api/subjects/${created.body.id}`);
  });

  test("a school without the Students module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/classes");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Students and admissions isn't part of your plan");
  });

  test("a teacher can read but not add a class", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    assert.equal((await teacher.get("/api/classes")).status, 200);
    const res = await teacher.post("/api/classes").send({ branchId: "br-1", name: "Class 12", order: 12 });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your role can't do this");
  });
});

describe("students: directory and admission", () => {
  test("the demo school's directory has its seeded students", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/students");
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 40);
    const ahmed = res.body.find((s) => s.id === "STD-1042");
    assert.equal(ahmed.name, "Ahmed Khan");
    assert.equal(ahmed.guardians.length, 2);
  });

  test("admission needs a real class and section at the student's campus", async () => {
    const owner = await signIn("tayyab@erp.com");
    const base = {
      admissionDate: "2026-10-01",
      name: "Test Student",
      email: "test.student@example.com",
      dateOfBirth: "2012-01-01",
      gender: "male",
      address: "Somewhere",
      branchId: "br-1",
      electiveSubjectIds: [],
      guardians: [{ name: "A Parent", relation: "father", phone: "0300-0000000", whatsapp: true, primary: true }],
      monthlyFee: 3000,
      discountPercent: 0,
    };
    const mismatched = await owner.post("/api/students").send({ ...base, classId: "br-1-9", sectionId: "br-1-10-A" });
    assert.equal(mismatched.status, 400);
    const wrongCampus = await owner.post("/api/students").send({ ...base, classId: "br-2-9", sectionId: "br-2-9-A", branchId: "br-1" });
    assert.equal(wrongCampus.status, 400);
  });

  test("admits a student, rejects a duplicate B-form, and logs activity", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/students").send({
      admissionDate: "2026-10-01",
      name: "Hamid Yousaf",
      email: "hamid.yousaf@example.com",
      bForm: "99999-1111111-1",
      dateOfBirth: "2012-06-15",
      gender: "male",
      address: "House 1, Lahore",
      branchId: "br-1",
      classId: "br-1-9",
      sectionId: "br-1-9-A",
      electiveSubjectIds: ["sub-cs"],
      guardians: [{ name: "Yousaf Khan", relation: "father", phone: "0300-9999999", whatsapp: true, primary: true }],
      monthlyFee: 3200,
      discountPercent: 0,
    });
    assert.equal(res.status, 201, res.text);
    assert.match(res.body.id, /^STD-\d+$/);
    assert.match(res.body.admissionNo, /^ADM-2026-\d{4}$/);
    assert.equal(res.body.avatar, "HY");
    assert.equal(res.body.enrollment, "active");

    const dup = await owner.post("/api/students").send({
      admissionDate: "2026-10-01",
      name: "Another Student",
      email: "another@example.com",
      bForm: "99999-1111111-1",
      dateOfBirth: "2012-01-01",
      gender: "female",
      address: "House 2, Lahore",
      branchId: "br-1",
      classId: "br-1-9",
      sectionId: "br-1-9-A",
      electiveSubjectIds: [],
      guardians: [{ name: "A Parent", relation: "father", phone: "0301-0000000", whatsapp: false, primary: true }],
      monthlyFee: 3000,
      discountPercent: 0,
    });
    assert.equal(dup.status, 409);

    const activity = await owner.get("/api/students/activity");
    assert.ok(activity.body.some((a) => a.studentId === res.body.id && /Admitted to Class 9, section A/.test(a.text)));
  });

  test("admission is refused once the plan's student seats are used up", async () => {
    await system.query("UPDATE organization SET student_seats = 0 WHERE id = 't-2'");
    const owner = await signIn("rabia@brightfuture.pk");
    const cls = await owner.post("/api/classes").send({ branchId: "br-t2", name: "Class 1", order: 1 });
    assert.equal(cls.status, 201);
    const section = await owner.post("/api/sections").send({ classId: cls.body.id, name: "A", shift: "morning", capacity: 30 });
    assert.equal(section.status, 201);
    const res = await owner.post("/api/students").send({
      admissionDate: "2026-10-01",
      name: "Seatless Student",
      email: "seatless@example.com",
      dateOfBirth: "2015-01-01",
      gender: "male",
      address: "Faisalabad",
      branchId: "br-t2",
      classId: cls.body.id,
      sectionId: section.body.id,
      electiveSubjectIds: [],
      guardians: [{ name: "A Parent", relation: "father", phone: "0302-0000000", whatsapp: true, primary: true }],
      monthlyFee: 2000,
      discountPercent: 0,
    });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /plan allows 0 students/);
    await system.query("UPDATE organization SET student_seats = 400 WHERE id = 't-2'");
    assert.equal(
      (
        await owner.post("/api/students").send({
          admissionDate: "2026-10-01",
          name: "Seated Student",
          email: "seated@example.com",
          dateOfBirth: "2015-01-01",
          gender: "female",
          address: "Faisalabad",
          branchId: "br-t2",
          classId: cls.body.id,
          sectionId: section.body.id,
          electiveSubjectIds: [],
          guardians: [{ name: "A Parent", relation: "mother", phone: "0302-1111111", whatsapp: true, primary: true }],
          monthlyFee: 2000,
          discountPercent: 0,
        })
      ).status,
      201,
    );
  });

  test("an accountant can't admit a student", async () => {
    const accountant = await signIn("ali@erp.com");
    const res = await accountant.post("/api/students").send({
      admissionDate: "2026-10-01",
      name: "Blocked Student",
      email: "blocked@example.com",
      dateOfBirth: "2015-01-01",
      gender: "male",
      address: "Lahore",
      branchId: "br-1",
      classId: "br-1-9",
      sectionId: "br-1-9-A",
      electiveSubjectIds: [],
      guardians: [{ name: "A Parent", relation: "father", phone: "0303-0000000", whatsapp: true, primary: true }],
      monthlyFee: 3000,
      discountPercent: 0,
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your role can't do this");
  });

  test("importStudents links siblings by a shared guardian phone, both ways", async () => {
    const owner = await signIn("tayyab@erp.com");
    const shared = "0311-5551234";
    const res = await owner.post("/api/students/import").send([
      {
        admissionDate: "2026-10-01",
        name: "Import One",
        email: "import.one@example.com",
        dateOfBirth: "2013-01-01",
        gender: "male",
        address: "Lahore",
        branchId: "br-1",
        classId: "br-1-7",
        sectionId: "br-1-7-A",
        electiveSubjectIds: [],
        guardians: [{ name: "Shared Parent", relation: "father", phone: shared, whatsapp: true, primary: true }],
        monthlyFee: 2800,
        discountPercent: 0,
      },
      {
        admissionDate: "2026-10-01",
        name: "Import Two",
        email: "import.two@example.com",
        dateOfBirth: "2011-01-01",
        gender: "female",
        address: "Lahore",
        branchId: "br-1",
        classId: "br-1-9",
        sectionId: "br-1-9-B",
        electiveSubjectIds: [],
        guardians: [{ name: "Shared Parent", relation: "father", phone: shared, whatsapp: true, primary: true }],
        monthlyFee: 3000,
        discountPercent: 0,
      },
    ]);
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.length, 2);
    const [one, two] = res.body;
    assert.ok(one.siblingIds.includes(two.id));
    assert.ok(two.siblingIds.includes(one.id));
  });
});

describe("students: profile, placement and lifecycle", () => {
  test("updateStudent rejects a B-form already used by someone else", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.patch("/api/students/STD-1044").send({ bForm: "35202-4567812-3" });
    assert.equal(res.status, 409);
    const ok = await owner.patch("/api/students/STD-1044").send({ name: "Bilal Tariq" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.avatar, "BT");
  });

  test("changeSection moves several students at once and clears electives on a class change", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/students/change-section").send({ ids: ["STD-1045"], classId: "br-1-9", sectionId: "br-1-9-A" });
    assert.equal(res.status, 201);
    const moved = (await owner.get("/api/students")).body.find((s) => s.id === "STD-1045");
    assert.equal(moved.sectionId, "br-1-9-A");
    assert.deepEqual(moved.electiveSubjectIds, []);
  });

  test("transferStudent needs a different campus and a valid placement there", async () => {
    const owner = await signIn("tayyab@erp.com");
    const sameCampus = await owner.post("/api/students/STD-1046/transfer").send({ branchId: "br-1", classId: "br-1-9", sectionId: "br-1-9-A" });
    assert.equal(sameCampus.status, 400);
    const res = await owner.post("/api/students/STD-1046/transfer").send({ branchId: "br-2", classId: "br-2-9", sectionId: "br-2-9-A" });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.branchId, "br-2");
    assert.deepEqual(res.body.electiveSubjectIds, []);
  });

  test("setElectives logs the subjects chosen", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.put("/api/students/STD-1043/electives").send({ subjectIds: ["sub-cs"] });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.electiveSubjectIds, ["sub-cs"]);
    const activity = await owner.get("/api/students/activity");
    assert.ok(activity.body.some((a) => a.studentId === "STD-1043" && /Electives set to Computer Science/.test(a.text)));
  });

  test("withdraw and readmit guard against repeating the same move", async () => {
    const owner = await signIn("tayyab@erp.com");
    const withdrawn = await owner.post("/api/students/STD-1047/withdraw").send({ date: "2026-10-05", reason: "relocated", note: "Moved city" });
    assert.equal(withdrawn.status, 201, withdrawn.text);
    assert.equal(withdrawn.body.enrollment, "withdrawn");
    assert.equal((await owner.post("/api/students/STD-1047/withdraw").send({ date: "2026-10-06", reason: "other" })).status, 409);

    const readmitted = await owner.post("/api/students/STD-1047/readmit").send({ classId: "br-1-9", sectionId: "br-1-9-A", date: "2026-10-10" });
    assert.equal(readmitted.status, 201, readmitted.text);
    assert.equal(readmitted.body.enrollment, "active");
    assert.equal(readmitted.body.withdrawal, undefined);
    assert.equal((await owner.post("/api/students/STD-1047/readmit").send({ classId: "br-1-9", sectionId: "br-1-9-A", date: "2026-10-11" })).status, 409);
  });

  test("updateGuardians needs exactly one primary guardian", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.equal((await owner.put("/api/students/STD-1048/guardians").send({ guardians: [] })).status, 400);
    assert.equal(
      (
        await owner.put("/api/students/STD-1048/guardians").send({
          guardians: [
            { name: "A", relation: "father", phone: "0300-1111111", whatsapp: true, primary: true },
            { name: "B", relation: "mother", phone: "0300-2222222", whatsapp: true, primary: true },
          ],
        })
      ).status,
      400,
    );
    const ok = await owner.put("/api/students/STD-1048/guardians").send({
      guardians: [{ name: "Sole Guardian", relation: "guardian", phone: "0300-3333333", whatsapp: false, primary: true }],
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.guardians.length, 1);
    assert.equal(ok.body.guardians[0].primary, true);
  });

  test("documents can be added and removed", async () => {
    const owner = await signIn("tayyab@erp.com");
    const added = await owner.post("/api/students/STD-1049/documents").send({ name: "Birth certificate", kind: "other", fileName: "birth.pdf", sizeKb: 120 });
    assert.equal(added.status, 201, added.text);
    const doc = added.body.documents.find((d) => d.name === "Birth certificate");
    assert.ok(doc);
    const removed = await owner.delete(`/api/students/STD-1049/documents/${doc.id}`);
    assert.equal(removed.status, 200);
    assert.ok(!removed.body.documents.some((d) => d.id === doc.id));
  });

  test("deleteStudent removes the record and cleans up sibling references", async () => {
    const owner = await signIn("tayyab@erp.com");
    const before = await owner.get("/api/students");
    const hamza = before.body.find((s) => s.id === "STD-1060");
    assert.ok(hamza.siblingIds.includes("STD-1042"));
    const deleted = await owner.delete("/api/students/STD-1060");
    assert.equal(deleted.status, 200);
    const ahmed = (await owner.get("/api/students")).body.find((s) => s.id === "STD-1042");
    assert.ok(!ahmed.siblingIds.includes("STD-1060"));
    assert.equal((await owner.delete("/api/students/STD-1060")).status, 404);
  });
});

describe("students: row-level security", () => {
  test("one school's classes and students are invisible to another", async () => {
    const owner2 = await signIn("rabia@brightfuture.pk");
    const cls = await owner2.post("/api/classes").send({ branchId: "br-t2", name: "Grade 1 Isolation Check", order: 1 });
    assert.equal(cls.status, 201);
    const section = await owner2.post("/api/sections").send({ classId: cls.body.id, name: "Z", shift: "morning", capacity: 30 });
    const admitted = await owner2.post("/api/students").send({
      admissionDate: "2026-10-01",
      name: "Isolated Student",
      email: "isolated@example.com",
      dateOfBirth: "2015-01-01",
      gender: "male",
      address: "Faisalabad",
      branchId: "br-t2",
      classId: cls.body.id,
      sectionId: section.body.id,
      electiveSubjectIds: [],
      guardians: [{ name: "A Parent", relation: "father", phone: "0304-0000000", whatsapp: true, primary: true }],
      monthlyFee: 2000,
      discountPercent: 0,
    });
    assert.equal(admitted.status, 201, admitted.text);

    const owner1 = await signIn("tayyab@erp.com");
    const classes = await owner1.get("/api/classes");
    assert.ok(!classes.body.some((c) => c.id === cls.body.id));
    const students = await owner1.get("/api/students");
    assert.ok(!students.body.some((s) => s.id === admitted.body.id));

    // Direct lookups by id are scoped too, not just the list endpoints.
    const directUpdate = await owner1.patch(`/api/students/${admitted.body.id}`).send({ name: "Hijacked" });
    assert.equal(directUpdate.status, 404);
  });
});
