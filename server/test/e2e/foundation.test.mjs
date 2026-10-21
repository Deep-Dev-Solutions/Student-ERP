// Phase 0 end-to-end tests: sign-in, school scoping (row-level security), suspension,
// permissions, invites and settings. Runs against the compiled app (dist/) and the
// test database from .env.test (npm run test:e2e reseeds it first).
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

/** A signed-in agent (keeps the session cookie). */
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

describe("sign-in and who am I", () => {
  test("health check needs no sign-in", async () => {
    const res = await request(server).get("/api/health");
    assert.equal(res.status, 200);
  });

  test("school routes need a session, with the frontend's error shape", async () => {
    const res = await request(server).get("/api/branches");
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { status: 401, message: "Sign in to continue" });
  });

  test("wrong password is refused", async () => {
    const res = await request(server).post("/api/auth/sign-in/email").set("origin", "http://localhost:3000").send({ email: "tayyab@erp.com", password: "nope-nope" });
    assert.notEqual(res.status, 200);
  });

  test("self sign-up is off", async () => {
    const res = await request(server).post("/api/auth/sign-up/email").set("origin", "http://localhost:3000").send({ email: "new@x.pk", password: "longpassword", name: "New Person" });
    assert.notEqual(res.status, 200);
  });

  test("/me returns the app's User shape and the active school", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "owner");
    assert.equal(res.body.user.initials, "TS");
    assert.equal(res.body.activeTenantId, "t-1");
  });

  test("the platform admin has no school until they open one", async () => {
    const admin = await signIn("support@deepdev.pk");
    const me = await admin.get("/api/me");
    assert.equal(me.body.user.role, "super_admin");
    assert.equal(me.body.platformAdmin, true);
    const res = await admin.get("/api/branches");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Open a school from the console first");
  });
});

describe("each school sees only its own data", () => {
  test("the demo school sees its four campuses", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.get("/api/branches");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((b) => b.id).sort(), ["br-1", "br-2", "br-3", "br-4"]);
  });

  test("another school sees only its campus and its own plan", async () => {
    const owner = await signIn("rabia@brightfuture.pk");
    const branches = await owner.get("/api/branches");
    assert.deepEqual(branches.body.map((b) => b.id), ["br-t2"]);
    const tenant = await owner.get("/api/tenant");
    assert.equal(tenant.body.id, "t-2");
    assert.deepEqual(tenant.body.modules, ["students", "fees", "paper_maker", "messages"]);
    const users = await owner.get("/api/users");
    assert.deepEqual(users.body.map((u) => u.email), ["rabia@brightfuture.pk"]);
  });

  test("row-level security blocks a raw query that forgets the school", async () => {
    const appUser = new pg.Client({ connectionString: process.env.APP_DATABASE_URL });
    await appUser.connect();
    try {
      const none = await appUser.query("SELECT count(*)::int AS n FROM branch");
      assert.equal(none.rows[0].n, 0, "no school set → no rows");
      await appUser.query("BEGIN");
      await appUser.query("SELECT set_config('app.tenant_id', 't-2', true)");
      const scoped = await appUser.query("SELECT tenant_id FROM branch");
      await appUser.query("COMMIT");
      assert.deepEqual([...new Set(scoped.rows.map((r) => r.tenant_id))], ["t-2"]);
      const users = await appUser.query("SELECT count(*)::int AS n FROM \"user\"");
      assert.equal(users.rows[0].n, 0, "people are hidden without a school");
      await assert.rejects(appUser.query("SELECT * FROM session"), /permission denied/);
    } finally {
      await appUser.end();
    }
  });

  test("every table with tenant_id has row-level security and a policy", async () => {
    const { rows } = await system.query(`
      SELECT c.relname, c.relrowsecurity, (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname)::int AS policies
      FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE a.attname = 'tenant_id' AND c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace`);
    assert.ok(rows.length >= 8);
    for (const r of rows) {
      assert.ok(r.relrowsecurity, `${r.relname} has row-level security`);
      assert.ok(r.policies > 0, `${r.relname} has a policy`);
    }
  });
});

describe("plan status", () => {
  test("a suspended school is refused", async () => {
    const owner = await signIn("farah@crescent.edu.pk");
    const res = await owner.get("/api/tenant");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Crescent Model School is suspended. Contact DeepDev support.");
  });
});

describe("permissions", () => {
  test("a teacher can read campuses but not add one", async () => {
    const teacher = await signIn("tariq.mahmood@erp.com");
    assert.equal((await teacher.get("/api/branches")).status, 200);
    const res = await teacher.post("/api/branches").send({ name: "New Campus", code: "NEW-01", location: "Lahore" });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your role can't do this");
  });

  test("the owner adds a campus; codes are unique within the school", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/branches").send({ name: "Model Town Campus", code: "mt-05", location: "Model Town" });
    assert.equal(res.status, 201);
    assert.equal(res.body.code, "MT-05");
    const dup = await owner.post("/api/branches").send({ name: "Again", code: "MT-05", location: "Lahore" });
    assert.equal(dup.status, 409);
    const audit = await system.query("SELECT actor_name FROM audit_log WHERE action = 'branch.added' AND tenant_id = 't-1'");
    assert.equal(audit.rows[0].actor_name, "Tayyab Saeed (owner)");
  });

  test("input validation uses the frontend error shape", async () => {
    const owner = await signIn("tayyab@erp.com");
    const res = await owner.post("/api/branches").send({ name: "X", code: "!", location: "" });
    assert.equal(res.status, 400);
    assert.equal(typeof res.body.message, "string");
    assert.equal(res.body.status, 400);
  });

  test("only the owner may change the permission matrix", async () => {
    const admin = await signIn("usman@erp.com");
    const current = (await admin.get("/api/settings/permissions")).body;
    const res = await admin.put("/api/settings/permissions").send(current);
    assert.equal(res.status, 403);
    const owner = await signIn("tayyab@erp.com");
    const ok = await owner.put("/api/settings/permissions").send({ ...current, fin_waive_fee: { ...current.fin_waive_fee, accountant: true } });
    assert.equal(ok.status, 200);
    assert.equal((await owner.get("/api/settings/permissions")).body.fin_waive_fee.accountant, true);
  });
});

describe("academic sessions", () => {
  test("a session must end after it starts, labels are unique, one is current", async () => {
    const owner = await signIn("tayyab@erp.com");
    assert.equal((await owner.post("/api/sessions").send({ label: "2027-2028", startDate: "2028-03-31", endDate: "2027-04-01" })).status, 400);
    const created = await owner.post("/api/sessions").send({ label: "2027-2028", startDate: "2027-04-01", endDate: "2028-03-31" });
    assert.equal(created.status, 201);
    assert.equal(created.body.startDate, "2027-04-01");
    assert.equal((await owner.post("/api/sessions").send({ label: "2027-2028", startDate: "2027-04-01", endDate: "2028-03-31" })).status, 409);
    assert.equal((await owner.put("/api/sessions/current").send({ sessionId: created.body.id })).status, 200);
    const list = (await owner.get("/api/sessions")).body;
    assert.deepEqual(list.filter((s) => s.current).map((s) => s.label), ["2027-2028"]);
  });
});

describe("users and invites", () => {
  test("an invited person sets a password from the link, signs in and becomes active", async () => {
    const owner = await signIn("tayyab@erp.com");
    const invited = await owner.post("/api/users").send({ name: "Hina Qadir", email: "Hina@School.pk", role: "teacher", title: "Physics", branchIds: ["br-1"] });
    assert.equal(invited.status, 201);
    assert.equal(invited.body.status, "invited");
    assert.equal((await owner.post("/api/users").send({ name: "Hina Qadir", email: "hina@school.pk", role: "teacher", branchIds: [] })).status, 409);

    const { rows } = await system.query("SELECT identifier FROM verification WHERE identifier LIKE 'reset-password:%' AND value = $1", [invited.body.id]);
    assert.equal(rows.length, 1, "a password link was issued");
    const token = rows[0].identifier.replace("reset-password:", "");
    const reset = await request(server).post("/api/auth/reset-password").set("origin", "http://localhost:3000").send({ token, newPassword: "hina-password-1" });
    assert.equal(reset.status, 200, reset.text);

    const hina = await signIn("hina@school.pk", "hina-password-1");
    assert.equal((await hina.get("/api/branches")).status, 200);
    const users = (await owner.get("/api/users")).body;
    assert.equal(users.find((u) => u.email === "hina@school.pk").status, "active");
  });

  test("turning access off locks the person out; the owner can't be turned off", async () => {
    const owner = await signIn("tayyab@erp.com");
    const users = (await owner.get("/api/users")).body;
    const sana = users.find((u) => u.email === "sana@erp.com");
    const ownerRow = users.find((u) => u.role === "owner");
    assert.equal((await owner.patch(`/api/users/${ownerRow.id}/status`).send({ status: "disabled" })).status, 400);
    const frontDesk = await signIn("sana@erp.com");
    assert.equal((await owner.patch(`/api/users/${sana.id}/status`).send({ status: "disabled" })).status, 200);
    const res = await frontDesk.get("/api/branches");
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Your access to this school is turned off");
    await owner.patch(`/api/users/${sana.id}/status`).send({ status: "active" });
  });
});

describe("settings", () => {
  test("campus profile saves and reads back", async () => {
    const owner = await signIn("tayyab@erp.com");
    const profile = (await owner.get("/api/settings/campus-profile")).body;
    const res = await owner.put("/api/settings/campus-profile").send({ ...profile, tagline: "Learning that lasts" });
    assert.equal(res.status, 200);
    assert.equal((await owner.get("/api/settings/campus-profile")).body.tagline, "Learning that lasts");
    assert.equal((await owner.put("/api/settings/campus-profile").send({ ...profile, contactEmail: "not-an-email" })).status, 400);
  });

  test("school rules are validated", async () => {
    const owner = await signIn("tayyab@erp.com");
    const rules = (await owner.get("/api/settings/rules")).body;
    const bad = await owner.put("/api/settings/rules").send({ ...rules, fees: { ...rules.fees, dueDay: 31 } });
    assert.equal(bad.status, 400);
    const ok = await owner.put("/api/settings/rules").send({ ...rules, fees: { ...rules.fees, dueDay: 12 } });
    assert.equal(ok.status, 200);
    assert.equal((await owner.get("/api/settings/rules")).body.fees.dueDay, 12);
  });
});
