// Unit tests for the ported business rules in src/domain/students.ts (compare to the
// mock's checkPlacement, seatProblem, placement and createStudent numbering).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { checkPlacement, placementText, seatProblem, admissionNumber, rollId, guardianProblem } = require("../../dist/domain/students.js");

describe("checkPlacement", () => {
  const cls = { id: "c1", branchId: "br-1", name: "Class 9" };
  const section = { id: "s1", classId: "c1", name: "A" };
  test("accepts a class and one of its sections", () => assert.equal(checkPlacement(cls, section, "c1"), null));
  test("refuses a section that belongs to another class", () => assert.match(checkPlacement(cls, { ...section, classId: "other" }, "c1"), /Choose a class/));
  test("refuses a missing class or section", () => {
    assert.match(checkPlacement(null, section, "c1"), /Choose a class/);
    assert.match(checkPlacement(cls, null, "c1"), /Choose a class/);
  });
  test("refuses a class at a different campus when a campus is given", () => assert.match(checkPlacement(cls, section, "c1", "br-2"), /different campus/));
  test("accepts the same campus", () => assert.equal(checkPlacement(cls, section, "c1", "br-1"), null));
});

describe("placementText", () => {
  test("names the class and section", () => assert.equal(placementText({ name: "Class 9" }, { name: "A" }), "Class 9, section A"));
  test("falls back when either is missing", () => assert.equal(placementText(null, null), "a class, section ?"));
});

describe("seatProblem", () => {
  test("allows admission within the seat limit", () => assert.equal(seatProblem(100, 40, 1), null));
  test("refuses admission once the plan's seats are used up", () => {
    const message = seatProblem(40, 40, 1);
    assert.match(message, /plan allows 40 students/);
    assert.match(message, /40 are enrolled/);
  });
  test("checks the whole batch on import", () => assert.match(seatProblem(40, 38, 5), /plan allows/));
});

describe("admission numbering", () => {
  test("admissionNumber pads the yearly sequence to four digits", () => assert.equal(admissionNumber("2026", 142), "ADM-2026-0142"));
  test("rollId formats a running roll number", () => assert.equal(rollId(1042), "STD-1042"));
});

describe("guardianProblem", () => {
  test("a student needs at least one guardian", () => assert.match(guardianProblem([]), /at least one guardian/));
  test("exactly one guardian must be primary", () => {
    assert.match(guardianProblem([{ primary: false }]), /one main guardian/);
    assert.match(guardianProblem([{ primary: true }, { primary: true }]), /one main guardian/);
  });
  test("accepts exactly one primary guardian", () => assert.equal(guardianProblem([{ primary: true }, { primary: false }]), null));
});
