// Unit tests for the ported business rules in src/domain/attendance.ts (compare to the
// mock's holidayOn, isLocked and useRegisterPermissions).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { holidayOn, isPastLockWindow, canMarkRegister, registerChanges, registerId } = require("../../dist/domain/attendance.js");

describe("holidayOn", () => {
  test("flags Sundays even with no holiday configured", () => assert.equal(holidayOn("2026-10-04", []), "Sunday"));
  test("flags a configured holiday", () => assert.equal(holidayOn("2026-12-25", [{ date: "2026-12-25", name: "Christmas" }]), "Christmas"));
  test("a plain school day is null", () => assert.equal(holidayOn("2026-10-05", []), null));
});

describe("isPastLockWindow", () => {
  test("end-of-day mode (0 hours) locks once the date is in the past", () => {
    assert.equal(isPastLockWindow("2026-10-01T08:00:00Z", "2026-10-01", "2026-10-02", 0), true);
    assert.equal(isPastLockWindow("2026-10-01T08:00:00Z", "2026-10-02", "2026-10-02", 0), false);
  });
  test("an hour-based window locks once that many hours pass since submission", () => {
    const longAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    const justNow = new Date().toISOString();
    assert.equal(isPastLockWindow(longAgo, "2026-10-01", "2026-10-01", 2), true);
    assert.equal(isPastLockWindow(justNow, "2026-10-01", "2026-10-01", 2), false);
  });
});

describe("canMarkRegister", () => {
  const section = { id: "sec-1", inchargeId: "STF-201" };
  test("owners, branch admins and super admins can always mark", () => {
    for (const role of ["owner", "branch_admin", "super_admin"]) {
      assert.equal(canMarkRegister({ role, mode: "admin_oversight", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false }).canMark, true);
    }
  });
  test("class_incharge mode: only the section's incharge may mark", () => {
    const incharge = canMarkRegister({ role: "teacher", staffId: "STF-201", mode: "class_incharge", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false });
    assert.equal(incharge.canMark, true);
    const other = canMarkRegister({ role: "teacher", staffId: "STF-999", mode: "class_incharge", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false });
    assert.equal(other.canMark, false);
    assert.match(other.reason, /class incharge/);
  });
  test("subject_wise mode depends on the allocation flag", () => {
    const allocated = canMarkRegister({ role: "teacher", staffId: "STF-1", mode: "subject_wise", section, subjectId: "sub-math", hasSubjectAllocation: true, hasAttMarkDailyPermission: false });
    assert.equal(allocated.canMark, true);
    const notAllocated = canMarkRegister({ role: "teacher", staffId: "STF-1", mode: "subject_wise", section, subjectId: "sub-math", hasSubjectAllocation: false, hasAttMarkDailyPermission: false });
    assert.equal(notAllocated.canMark, false);
    assert.match(notAllocated.reason, /subjects you teach/);
  });
  test("single_marker and admin_oversight modes never let a teacher mark", () => {
    assert.equal(canMarkRegister({ role: "teacher", mode: "single_marker", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false }).canMark, false);
    assert.equal(canMarkRegister({ role: "teacher", mode: "admin_oversight", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false }).canMark, false);
  });
  test("a non-teacher, non-admin role (front desk) follows the permission matrix, except in subject_wise mode", () => {
    const allowed = canMarkRegister({ role: "front_desk", mode: "class_incharge", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: true });
    assert.equal(allowed.canMark, true);
    const noPermission = canMarkRegister({ role: "front_desk", mode: "class_incharge", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: false });
    assert.equal(noPermission.canMark, false);
    const subjectWise = canMarkRegister({ role: "front_desk", mode: "subject_wise", section, hasSubjectAllocation: false, hasAttMarkDailyPermission: true });
    assert.equal(subjectWise.canMark, false);
  });
});

describe("registerChanges", () => {
  test("only marks that actually changed status are recorded", () => {
    const existing = { "STD-1": { status: "present" }, "STD-2": { status: "absent" } };
    const next = { "STD-1": { status: "present" }, "STD-2": { status: "present" } };
    const changes = registerChanges(existing, next, "Ali Raza (Accountant)", "late arrival");
    assert.equal(changes.length, 1);
    assert.equal(changes[0].studentId, "STD-2");
    assert.equal(changes[0].from, "absent");
    assert.equal(changes[0].to, "present");
    assert.equal(changes[0].reason, "late arrival");
  });
});

describe("registerId", () => {
  test("a daily register has no subject suffix", () => assert.equal(registerId("sec-1", "2026-10-01"), "sec-1:2026-10-01"));
  test("a subject-wise register includes the subject", () => assert.equal(registerId("sec-1", "2026-10-01", "sub-math"), "sec-1:2026-10-01:sub-math"));
});
