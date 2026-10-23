// Phase 6 end-to-end tests: the global paper catalogue and question bank, and
// the full paper lifecycle (draft, submit, print, return).
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

const draftInput = (teacherId, overrides = {}) => ({
  teacherId,
  branchId: "br-1",
  step: 5,
  boardId: "ptb",
  classId: "ptb-9",
  bookId: "ptb-9-phy",
  subTopicIds: ["ptb-9-phy-ch1-t1"],
  blueprint: [{ type: "short", count: 1, marks: 5 }],
  questions: [{ id: "q1", type: "short", text: "Define mass.", answer: "The amount of matter in a body.", marks: 5, subTopicId: "ptb-9-phy-ch1-t1" }],
  details: { examName: "Weekly test", date: "2026-11-05", timeAllowed: "30 minutes", instructions: "Answer all." },
  ...overrides,
});

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

describe("paper maker: catalogue, question bank and module gating", () => {
  test("the demo school has a catalogue and a question bank", async () => {
    const owner = await signIn("tayyab@erp.com");
    const catalog = await owner.get("/api/paper-catalog");
    assert.ok(catalog.body.boards.some((b) => b.id === "ptb"));
    assert.ok(catalog.body.subTopics.length > 0);
    assert.ok((await owner.get("/api/question-bank")).body.length > 0);
  });

  test("a teacher can read the question bank; a front desk officer can't", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    assert.equal((await teacher.get("/api/question-bank")).status, 200);
    const frontDesk = await signIn("sana@erp.com");
    assert.equal((await frontDesk.get("/api/question-bank")).status, 403);
  });

  test("a school without the Paper maker module is refused", async () => {
    await system.query("UPDATE organization SET modules = array_remove(modules, 'paper_maker') WHERE id = 't-3'");
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/paper-catalog");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Paper maker isn't part of your plan");
    await system.query("UPDATE organization SET modules = array_append(modules, 'paper_maker') WHERE id = 't-3'");
  });
});

describe("paper maker: directory and ownership", () => {
  test("an owner sees every paper; a teacher sees only their own", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.equal((await owner.get("/api/papers")).body.length, 5);

    const teacher = await signIn("tariq.mahmood@erp.com");
    const own = (await teacher.get("/api/papers")).body;
    assert.equal(own.length, 3);
    assert.ok(own.every((p) => p.teacherId === "STF-201"));
  });

  test("a branch admin with canPrintPapers sees every non-draft paper, but not another teacher's draft", async () => {
    const admin = await signIn("usman@erp.com");
    const papers = (await admin.get("/api/papers")).body;
    assert.ok(!papers.some((p) => p.id === "pap-1")); // draft, not theirs
    assert.ok(papers.some((p) => p.id === "pap-4")); // printed, someone else's
  });
});

describe("paper maker: creating and editing drafts", () => {
  test("a teacher's own staffId wins over whatever teacherId is sent", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const created = await teacher.post("/api/papers").send(draftInput("STF-202"));
    assert.equal(created.status, 201, created.text);
    assert.equal(created.body.teacherId, "STF-201");
  });

  test("an owner can create a draft on behalf of a named teacher", async () => {
    const owner = await signIn("tayyab@erp.com");
    const created = await owner.post("/api/papers").send(draftInput("STF-203"));
    assert.equal(created.status, 201, created.text);
    assert.equal(created.body.teacherId, "STF-203");
  });

  test("a teacher can't edit another teacher's paper", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.put("/api/papers").send({ ...draftInput("STF-202"), id: "pap-4" });
    assert.equal(res.status, 403);
  });

  test("a submitted paper can't be saved as a draft again", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.put("/api/papers").send({ ...draftInput("STF-201"), id: "pap-2" });
    assert.equal(res.status, 409);
  });

  test("a teacher can save their own draft", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.put("/api/papers").send({ ...draftInput("STF-201"), id: "pap-1", step: 6 });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.step, 6);
  });
});

describe("paper maker: submitting", () => {
  test("an incomplete paper is refused", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const created = await teacher.post("/api/papers").send(draftInput("STF-201", { details: { examName: "", date: "", timeAllowed: "", instructions: "" } }));
    assert.equal(created.status, 201, created.text);
    const submitted = await teacher.post(`/api/papers/${created.body.id}/submit`);
    assert.equal(submitted.status, 400);
  });

  test("a teacher can submit their own complete draft; they can't submit it twice", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const created = await teacher.post("/api/papers").send(draftInput("STF-201"));
    assert.equal(created.status, 201, created.text);
    const submitted = await teacher.post(`/api/papers/${created.body.id}/submit`);
    assert.equal(submitted.status, 201, submitted.text);
    assert.equal(submitted.body.status, "submitted");
    const again = await teacher.post(`/api/papers/${created.body.id}/submit`);
    assert.equal(again.status, 409);
  });

  test("a teacher can't submit someone else's paper", async () => {
    const owner = await signIn("tayyab@erp.com");
    const created = await owner.post("/api/papers").send(draftInput("STF-203"));
    const teacher = await signIn("tariq.mahmood@erp.com");
    const res = await teacher.post(`/api/papers/${created.body.id}/submit`);
    assert.equal(res.status, 403);
  });
});

describe("paper maker: printing and returning", () => {
  test("canPrintPapers is required to print, return or fetch the printable paper", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    assert.equal((await teacher.post("/api/papers/pap-2/printed")).status, 403);
    assert.equal((await teacher.post("/api/papers/pap-2/return").send({ note: "Please redo section B" })).status, 403);
    assert.equal((await teacher.get("/api/papers/pap-2/printable")).status, 403);
  });

  test("only a submitted paper can be marked printed or returned", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.equal((await owner.post("/api/papers/pap-1/printed")).status, 409); // draft
    assert.equal((await owner.post("/api/papers/pap-1/return").send({ note: "Needs more questions" })).status, 409);
  });

  test("a return note must be at least 5 characters", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/papers/pap-5/return").send({ note: "no" });
    assert.equal(res.status, 400);
  });

  test("an owner can return a submitted paper to its teacher", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/papers/pap-5/return").send({ note: "Add a diagram question" });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.status, "returned");
    assert.equal(res.body.returnNote, "Add a diagram question");
  });

  test("the printable paper is only available once submitted or printed", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.equal((await owner.get("/api/papers/pap-4/printable")).status, 200);
    assert.equal((await owner.get("/api/papers/pap-5/printable")).status, 409); // just returned above
  });
});

describe("paper maker: row-level security", () => {
  test("one school's papers are invisible to another", async () => {
    const owner2 = await signIn("kashif@scholarshub.pk");
    const created = await owner2.post("/api/papers").send(draftInput("STF-900", { branchId: "br-t3" }));
    assert.equal(created.status, 201, created.text);

    const owner1 = await signIn("tayyab@erp.com");
    const papers = await owner1.get("/api/papers");
    assert.ok(!papers.body.some((p) => p.teacherId === "STF-900"));
  });
});
