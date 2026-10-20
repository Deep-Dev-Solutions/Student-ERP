"use client";

import { useState } from "react";
import { paperProblem } from "@/services/paper/contract";
import { errorMessage, useGetPaperCatalogQuery, useGetQuestionBankQuery, useSavePaperDraftMutation, useSubmitPaperMutation } from "@/store/api";
import type { BankQuestion, BlueprintRow, Paper, PaperDraftInput, PaperQuestion } from "@/types";
import { DEFAULT_BLUEPRINT, typeLabel } from "./helpers";

export const STEPS = [
  { title: "Board", hint: "Textbook board" },
  { title: "Class", hint: "For that board" },
  { title: "Book", hint: "Subject or book" },
  { title: "Chapters", hint: "And sub topics" },
  { title: "Questions", hint: "Types, marks, review" },
  { title: "Details", hint: "Exam and submit" },
] as const;

/** A change that would lose later work, waiting for the user to confirm. */
export interface PendingChange {
  title: string;
  description: string;
  confirmLabel: string;
  apply: () => void;
}

const blank = (teacherId: string, branchId: string): PaperDraftInput => ({
  teacherId,
  branchId,
  step: 1,
  boardId: "",
  classId: "",
  bookId: "",
  subTopicIds: [],
  blueprint: DEFAULT_BLUEPRINT,
  questions: [],
  details: { examName: "", date: "", timeAllowed: "60 minutes", instructions: "Attempt all questions. Write neatly. Marks for each question are shown against it." },
});

const questionId = () => `q-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const shuffle = <T,>(list: T[]) => list.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
const fromBank = (q: BankQuestion, marks: number): PaperQuestion => ({ id: questionId(), type: q.type, text: q.text, options: q.options, answer: q.answer, marks, subTopicId: q.subTopicId, bankId: q.id });

/** Whether each step is complete; the wizard can't go past the first one that isn't. */
export function stepValid(d: PaperDraftInput, step: number): boolean {
  if (step === 1) return Boolean(d.boardId);
  if (step === 2) return Boolean(d.classId);
  if (step === 3) return Boolean(d.bookId);
  if (step === 4) return d.subTopicIds.length > 0;
  if (step === 5) return d.questions.length > 0 && !paperProblem({ ...d, details: { examName: "x", date: "x", timeAllowed: "x", instructions: "" } });
  return !paperProblem(d);
}

export function usePaperWizard(opts: { paper?: Paper; teacherId: string; branchId: string }) {
  const { data: catalog } = useGetPaperCatalogQuery();
  const { data: bank = [] } = useGetQuestionBankQuery();
  const [saveDraft, { isLoading: saving }] = useSavePaperDraftMutation();
  const [submitPaper, { isLoading: submitting }] = useSubmitPaperMutation();
  const [draft, setDraft] = useState<PaperDraftInput>(() => (opts.paper ? { ...opts.paper } : blank(opts.teacherId, opts.branchId)));
  const [step, setStep] = useState(() => Math.min(opts.paper?.step ?? 1, firstInvalid(opts.paper ?? blank(opts.teacherId, opts.branchId))));
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});

  const update = (changes: Partial<PaperDraftInput>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setDirty(true);
    setNotice({});
  };
  /** Runs a change now, or asks first when it would lose work. */
  const guarded = (loses: string[], change: Partial<PaperDraftInput>, title: string, confirmLabel: string) => {
    if (loses.length === 0) return update(change);
    setPending({ title, description: `This clears ${loses.join(", ")}. You can't undo it.`, confirmLabel, apply: () => update(change) });
  };

  const scope = {
    classes: catalog?.classes.filter((c) => c.boardId === draft.boardId) ?? [],
    books: catalog?.books.filter((b) => b.boardId === draft.boardId && b.classId === draft.classId) ?? [],
    chapters: (catalog?.chapters.filter((c) => c.bookId === draft.bookId) ?? []).sort((a, b) => a.number - b.number),
    subTopics: catalog?.subTopics ?? [],
    pool: bank.filter((q) => draft.subTopicIds.includes(q.subTopicId)),
  };

  const downstream = (from: "class" | "book" | "chapters" | "questions") => {
    const out: string[] = [];
    if (from === "class" && draft.classId) out.push("the class");
    if ((from === "class" || from === "book") && draft.bookId) out.push("the book");
    if (from !== "questions" && draft.subTopicIds.length) out.push("the chapters you picked");
    if (draft.questions.length) out.push(plural(draft.questions.length, "question"));
    return out;
  };

  const chooseBoard = (boardId: string) =>
    boardId !== draft.boardId && guarded(downstream("class"), { boardId, classId: "", bookId: "", subTopicIds: [], questions: [] }, "Change the board?", "Change board");
  const chooseClass = (classId: string) =>
    classId !== draft.classId && guarded(downstream("book"), { classId, bookId: "", subTopicIds: [], questions: [] }, "Change the class?", "Change class");
  const chooseBook = (bookId: string) =>
    bookId !== draft.bookId && guarded(downstream("chapters"), { bookId, subTopicIds: [], questions: [] }, "Change the book?", "Change book");

  /** Narrowing the scope drops only the questions drawn from sub topics no longer picked; your own questions stay. */
  const setSubTopics = (subTopicIds: string[]) => {
    const kept = draft.questions.filter((q) => q.custom || !q.subTopicId || subTopicIds.includes(q.subTopicId));
    const lost = draft.questions.length - kept.length;
    if (lost === 0) return update({ subTopicIds, questions: kept });
    setPending({
      title: "Remove questions from those sub topics?",
      description: `${plural(lost, "question")} came from sub topics you're unticking and will be removed. Your other questions stay.`,
      confirmLabel: "Untick and remove",
      apply: () => update({ subTopicIds, questions: kept }),
    });
  };

  const setBlueprint = (blueprint: BlueprintRow[]) => update({ blueprint });

  /** Draws questions for the blueprint from the picked scope; your own questions are kept. */
  const drawQuestions = () => {
    const run = () => {
      const short: string[] = [];
      const drawn = draft.blueprint.flatMap((row) => {
        if (row.count <= 0) return [];
        const pool = shuffle(scope.pool.filter((q) => q.type === row.type));
        if (pool.length < row.count) short.push(`${pool.length} ${typeLabel(row.type).toLowerCase()}`);
        return pool.slice(0, row.count).map((q) => fromBank(q, row.marks));
      });
      const own = draft.questions.filter((q) => q.custom);
      update({ questions: [...drawn, ...own] });
      setNotice(short.length ? { error: `The chosen chapters only have ${short.join(" and ")} questions, so fewer were drawn. Add your own or pick more sub topics.` } : { success: `${plural(drawn.length, "question")} drawn.` });
    };
    const replaced = draft.questions.filter((q) => !q.custom).length;
    if (replaced === 0) return run();
    setPending({
      title: "Draw new questions?",
      description: `This replaces the ${plural(replaced, "drawn question")}, including any edits to them. Questions you wrote yourself stay.`,
      confirmLabel: "Draw again",
      apply: run,
    });
  };

  /** Another question of the same type from the scope that isn't on the paper yet. */
  const swapOptions = (q: PaperQuestion) => scope.pool.filter((b) => b.type === q.type && !draft.questions.some((x) => x.bankId === b.id));
  const swap = (id: string) => {
    const q = draft.questions.find((x) => x.id === id);
    const options = q ? swapOptions(q) : [];
    if (!q || options.length === 0) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    update({ questions: draft.questions.map((x) => (x.id === id ? { ...fromBank(pick, q.marks), id } : x)) });
  };
  const editQuestion = (id: string, changes: Partial<PaperQuestion>) => update({ questions: draft.questions.map((q) => (q.id === id ? { ...q, ...changes } : q)) });
  const removeQuestion = (id: string) => update({ questions: draft.questions.filter((q) => q.id !== id) });
  const addQuestion = (q: Omit<PaperQuestion, "id">) => update({ questions: [...draft.questions, { ...q, id: questionId(), custom: true }] });
  const setDetails = (changes: Partial<PaperDraftInput["details"]>) => update({ details: { ...draft.details, ...changes } });

  const reachable = firstInvalid(draft);
  const goTo = (n: number) => {
    if (n < 1 || n > Math.min(reachable, STEPS.length)) return;
    setStep(n);
    setNotice({});
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const save = async (): Promise<Paper | null> => {
    const result = await saveDraft({ ...draft, step });
    if ("error" in result) {
      setNotice({ error: errorMessage(result.error) });
      return null;
    }
    setDraft((d) => ({ ...d, id: result.data.id }));
    setDirty(false);
    setNotice({ success: `Draft saved at ${new Date().toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}.` });
    return result.data;
  };

  const submit = async (): Promise<Paper | null> => {
    const saved = await save();
    if (!saved) return null;
    const result = await submitPaper({ id: saved.id, teacherId: draft.teacherId });
    if ("error" in result) {
      setNotice({ error: errorMessage(result.error) });
      return null;
    }
    return result.data;
  };

  return {
    draft,
    step,
    reachable,
    scope,
    pending,
    dirty,
    notice,
    saving,
    submitting,
    setPending,
    goTo,
    chooseBoard,
    chooseClass,
    chooseBook,
    setSubTopics,
    setBlueprint,
    drawQuestions,
    swapOptions,
    swap,
    editQuestion,
    removeQuestion,
    addQuestion,
    setDetails,
    save,
    submit,
  };
}

/** The furthest step that can be opened: the first incomplete one. */
function firstInvalid(d: PaperDraftInput) {
  for (let n = 1; n <= STEPS.length; n++) if (!stepValid(d, n)) return n;
  return STEPS.length;
}

export type PaperWizard = ReturnType<typeof usePaperWizard>;
