// Unit tests: the permission rule, the module and permission guards, and that the
// server's module map matches the frontend's (client/src/lib/modules.ts).
import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

process.env.DATABASE_URL ??= "postgresql://x:x@localhost:5433/x";
process.env.APP_DATABASE_URL ??= "postgresql://x:x@localhost:5433/x";
process.env.WEB_ORIGIN ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "unit-test-secret-unit-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

const require = createRequire(import.meta.url);
const { hasPermission } = require("../../dist/common/permissions.js");
const { moduleForPermission, MODULE_REQUIRES } = require("../../dist/common/modules.js");
const { ModuleGuard } = require("../../dist/common/guards/module.guard.js");
const { PermissionGuard } = require("../../dist/common/guards/permission.guard.js");
const { requestContext } = require("../../dist/common/context.js");

/** A minimal ExecutionContext and Reflector for one route's metadata. */
function routeWith(meta) {
  const reflector = { getAllAndOverride: (key) => meta[key] };
  const context = { getHandler: () => null, getClass: () => null };
  return { reflector, context };
}

describe("hasPermission", () => {
  const matrix = { fin_collect_fee: { accountant: true, teacher: false } };
  test("owners hold every permission", () => assert.equal(hasPermission("owner", "anything", {}), true));
  test("other roles follow the matrix", () => {
    assert.equal(hasPermission("accountant", "fin_collect_fee", matrix), true);
    assert.equal(hasPermission("teacher", "fin_collect_fee", matrix), false);
    assert.equal(hasPermission("teacher", "missing", matrix), false);
  });
});

describe("ModuleGuard", () => {
  test("allows routes whose module is on the plan", () => {
    const { reflector, context } = routeWith({ requireModule: "fees" });
    const guard = new ModuleGuard(reflector);
    requestContext.run({ modules: ["students", "fees"] }, () => assert.equal(guard.canActivate(context), true));
  });
  test("refuses a module that isn't on the plan with a clear message", () => {
    const { reflector, context } = routeWith({ requireModule: "attendance" });
    const guard = new ModuleGuard(reflector);
    requestContext.run({ modules: ["paper_maker"] }, () =>
      assert.throws(() => guard.canActivate(context), (e) => e.getStatus() === 403 && e.getResponse().message === "Attendance isn't part of your plan"),
    );
  });
  test("routes without a module are core", () => {
    const { reflector, context } = routeWith({});
    requestContext.run({ modules: [] }, () => assert.equal(new ModuleGuard(reflector).canActivate(context), true));
  });
});

describe("PermissionGuard", () => {
  const prisma = (matrix) => ({ tenant: { tenantPermissions: { findFirst: async () => ({ matrix }) } } });
  test("a permission whose module is off is refused before the matrix is read", async () => {
    const { reflector, context } = routeWith({ requirePermission: "fin_collect_fee" });
    const guard = new PermissionGuard(reflector, prisma({ fin_collect_fee: { accountant: true } }));
    await requestContext.run({ role: "accountant", modules: ["paper_maker"] }, async () =>
      assert.rejects(guard.canActivate(context), (e) => e.getResponse().message === "Fees isn't part of your plan"),
    );
  });
  test("the matrix decides when the module is on", async () => {
    const { reflector, context } = routeWith({ requirePermission: "fin_collect_fee" });
    const guard = new PermissionGuard(reflector, prisma({ fin_collect_fee: { accountant: true, teacher: false } }));
    await requestContext.run({ role: "accountant", modules: ["students", "fees"] }, async () => assert.equal(await guard.canActivate(context), true));
    await requestContext.run({ role: "teacher", modules: ["students", "fees"] }, async () =>
      assert.rejects(guard.canActivate(context), (e) => e.getResponse().message === "Your role can't do this"),
    );
  });
});

describe("module map matches the frontend", () => {
  const client = readFileSync(new URL("../../../client/src/lib/modules.ts", import.meta.url), "utf8");
  test("every permission maps to the same module", () => {
    const block = client.slice(client.indexOf("const PERMISSION_MODULES"), client.indexOf("export const moduleForPermission"));
    const pairs = [...block.matchAll(/(\w+): "(\w+)"/g)].map((m) => [m[1], m[2]]);
    assert.ok(pairs.length > 10);
    for (const [perm, mod] of pairs) assert.equal(moduleForPermission(perm), mod, perm);
  });
  test("module requirements are the same", () => {
    const entries = [...client.matchAll(/\{ key: "(\w+)",[^}]*requires: \[([^\]]*)\]/g)];
    assert.equal(entries.length, Object.keys(MODULE_REQUIRES).length, "every module compared");
    for (const m of entries) {
      const requires = [...m[2].matchAll(/"(\w+)"/g)].map((x) => x[1]);
      assert.deepEqual(MODULE_REQUIRES[m[1]], requires, m[1]);
    }
  });
});
