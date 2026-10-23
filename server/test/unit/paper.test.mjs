// Unit tests for the ported business rule in src/domain/paper.ts (compare to
// client/src/services/paper/contract.ts's paperProblem).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { paperProblem } = require("../../dist/domain/paper.js");

const complete = {
  boardId: "ptb",
  classId: "ptb-9",
  bookId: "ptb-9-phy",
  subTopicIds: ["ptb-9-phy-ch1-t1"],
  questions: [{ text: "Define mass.", marks: 2, type: "short" }],
  details: { examName: "Monthly test", date: "2026-11-01", timeAllowed: "60 minutes" },
};

describe("paperProblem", () => {
  test("a fully filled-in paper has no problem", () => assert.equal(paperProblem(complete), null));
  test("missing board, class or book is reported in order", () => {
    assert.equal(paperProblem({ ...complete, boardId: "" }), "Choose a board");
    assert.equal(paperProblem({ ...complete, classId: "" }), "Choose a class");
    assert.equal(paperProblem({ ...complete, bookId: "" }), "Choose a book");
  });
  test("no sub topics or no questions is reported", () => {
    assert.equal(paperProblem({ ...complete, subTopicIds: [] }), "Pick at least one chapter or sub topic");
    assert.equal(paperProblem({ ...complete, questions: [] }), "Add at least one question");
  });
  test("a question missing text or marks is reported", () => {
    assert.equal(paperProblem({ ...complete, questions: [{ text: "  ", marks: 2, type: "short" }] }), "Every question needs text and marks");
    assert.equal(paperProblem({ ...complete, questions: [{ text: "Define mass.", marks: 0, type: "short" }] }), "Every question needs text and marks");
  });
  test("an mcq needs exactly four non-empty options", () => {
    assert.equal(paperProblem({ ...complete, questions: [{ text: "Pick one.", marks: 1, type: "mcq", options: ["A", "B", "C"] }] }), "Every multiple choice question needs four options");
    assert.equal(paperProblem({ ...complete, questions: [{ text: "Pick one.", marks: 1, type: "mcq", options: ["A", "B", "C", ""] }] }), "Every multiple choice question needs four options");
    assert.equal(paperProblem({ ...complete, questions: [{ text: "Pick one.", marks: 1, type: "mcq", options: ["A", "B", "C", "D"] }] }), null);
  });
  test("missing exam name, date or time allowed is reported", () => {
    assert.equal(paperProblem({ ...complete, details: { ...complete.details, examName: " " } }), "Enter the exam name");
    assert.equal(paperProblem({ ...complete, details: { ...complete.details, date: "" } }), "Choose the exam date");
    assert.equal(paperProblem({ ...complete, details: { ...complete.details, timeAllowed: " " } }), "Enter the time allowed");
  });
});
