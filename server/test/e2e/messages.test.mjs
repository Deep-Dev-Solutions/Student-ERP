// Phase 7 end-to-end tests: message templates and sending (audience resolution and
// rendering happen client-side; the server validates, prices and records the send).
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

const recipient = (overrides = {}) => ({ name: "Imran Raza", phone: "0310-4000000", channel: "sms", text: "Dear Imran Raza, fees are due.", ...overrides });

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

describe("messages: directory and module gating", () => {
  test("the demo school has templates and a message log", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.ok((await owner.get("/api/message-templates")).body.some((t) => t.id === "tpl-fee"));
    assert.ok((await owner.get("/api/messages")).body.length > 0);
  });

  test("a school without the Messages module is refused", async () => {
    const owner = await signIn("kashif@scholarshub.pk");
    const res = await owner.get("/api/messages");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Messages isn't part of your plan");
  });
});

describe("messages: sending", () => {
  test("only fin_send_sms can send a message", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/messages").send({ branchId: "br-1", channel: "sms", audience: "Parents with overdue fees", template: "Fee reminder", recipients: [recipient()] });
    assert.equal(denied.status, 403);
  });

  test("an empty audience, blank text, or an unresolved placeholder is refused", async () => {
    const owner = await signIn("tayyab@erp.com");
    const empty = await owner.post("/api/messages").send({ branchId: "br-1", channel: "sms", audience: "Parents with overdue fees", template: "Fee reminder", recipients: [] });
    assert.equal(empty.status, 400);

    const blank = await owner.post("/api/messages").send({ branchId: "br-1", channel: "sms", audience: "Parents with overdue fees", template: "Fee reminder", recipients: [recipient({ text: "   " })] });
    assert.equal(blank.status, 400);

    const placeholder = await owner.post("/api/messages").send({ branchId: "br-1", channel: "sms", audience: "Parents with overdue fees", template: "Fee reminder", recipients: [recipient({ text: "Dear {name}, fees are due." })] });
    assert.equal(placeholder.status, 400);
  });

  test("a front desk officer and an accountant can both send; cost and segments are computed server-side", async () => {
    const frontDesk = await signIn("sana@erp.com");
    const longText = "a".repeat(161); // over one SMS segment
    const sent = await frontDesk.post("/api/messages").send({
      branchId: "br-1",
      channel: "sms",
      audience: "Parents of Class 9",
      template: "Fee reminder",
      recipients: [recipient({ text: longText }), recipient({ phone: "0300-1234567", channel: "whatsapp", text: "Short WhatsApp text" })],
    });
    assert.equal(sent.status, 201, sent.text);
    assert.equal(sent.body.smsSegments, Math.ceil(161 / 153));
    assert.equal(sent.body.cost, Math.ceil(161 / 153) * 1.5 + 2.5);

    const accountant = await signIn("ali@erp.com");
    const sent2 = await accountant.post("/api/messages").send({ branchId: "br-1", channel: "sms", audience: "Parents with overdue fees", template: "Fee reminder", recipients: [recipient()] });
    assert.equal(sent2.status, 201, sent2.text);

    assert.ok((await accountant.get("/api/messages")).body.some((m) => m.id === sent.body.id));
  });
});

describe("messages: templates", () => {
  test("a short name or body is refused, and only fin_send_sms can save one", async () => {
    const owner = await signIn("tayyab@erp.com");
    const shortName = await owner.post("/api/message-templates").send({ name: "Hi", body: "A reasonably long template body." });
    assert.equal(shortName.status, 400);
    const shortBody = await owner.post("/api/message-templates").send({ name: "New template", body: "short" });
    assert.equal(shortBody.status, 400);

    const teacher = await signIn("tariq.mahmood@erp.com");
    const denied = await teacher.post("/api/message-templates").send({ name: "Teacher template", body: "A reasonably long template body." });
    assert.equal(denied.status, 403);
  });

  test("a duplicate name (case-insensitive) is refused; a new template can be added", async () => {
    const owner = await signIn("tayyab@erp.com");
    const dup = await owner.post("/api/message-templates").send({ name: "fee reminder", body: "A reasonably long duplicate body." });
    assert.equal(dup.status, 409);

    const created = await owner.post("/api/message-templates").send({ name: "Exam schedule", body: "Dear {name}, the exam schedule for {class} is attached." });
    assert.equal(created.status, 201, created.text);
    assert.ok((await owner.get("/api/message-templates")).body.some((t) => t.id === created.body.id));
  });

  test("a built-in template can't be deleted, but a custom one can", async () => {
    const owner = await signIn("tayyab@erp.com");
    const blocked = await owner.delete("/api/message-templates/tpl-fee");
    assert.equal(blocked.status, 409);

    const created = await owner.post("/api/message-templates").send({ name: "Temporary notice", body: "This template will be deleted shortly." });
    assert.equal(created.status, 201, created.text);
    const deleted = await owner.delete(`/api/message-templates/${created.body.id}`);
    assert.equal(deleted.status, 200, deleted.text);
    assert.ok(!(await owner.get("/api/message-templates")).body.some((t) => t.id === created.body.id));
  });
});

describe("messages: row-level security", () => {
  test("one school's templates are invisible to another", async () => {
    await system.query("UPDATE organization SET modules = array_append(modules, 'messages') WHERE id = 't-3' AND NOT ('messages' = ANY(modules))");
    const owner2 = await signIn("kashif@scholarshub.pk");
    const created = await owner2.post("/api/message-templates").send({ name: "Isolation template", body: "This template belongs to another school." });
    assert.equal(created.status, 201, created.text);

    const owner1 = await signIn("tayyab@erp.com");
    const templates = await owner1.get("/api/message-templates");
    assert.ok(!templates.body.some((t) => t.name === "Isolation template"));

    await system.query("UPDATE organization SET modules = array_remove(modules, 'messages') WHERE id = 't-3'");
  });
});
