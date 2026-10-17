"use client";

import { useEffect, useState } from "react";
import { errorMessage, useGetRegistersQuery, useGetSchoolRulesQuery, useSubmitRegisterMutation } from "@/store/api";
import { registerId, type AttendanceMark, type AttendanceRegister, type AttendanceStatus, type Student } from "@/types";
import { holidayOn, isLocked, useOnline, useRoster, useToday } from "./hooks";

type Marks = Record<string, AttendanceMark>;
type RegisterInput = Pick<AttendanceRegister, "branchId" | "classId" | "sectionId" | "date" | "subjectId">;

const DRAFT_PREFIX = "dd_register_draft:";
const OUTBOX_KEY = "dd_register_outbox";

interface Draft {
  marks: Marks;
  savedAt: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the register still works without a draft.
  }
}

/** Registers waiting to be submitted when the connection returns. */
export const readOutbox = () => readJson<(RegisterInput & { marks: Marks })[]>(OUTBOX_KEY) ?? [];

/** Everyone present, unless a mark is already saved. */
const defaultMarks = (roster: Student[], saved?: Marks): Marks =>
  Object.fromEntries(roster.map((s) => [s.id, saved?.[s.id] ?? { status: "present" as const }]));

/**
 * State for marking one register. Marks start from the saved register, or a
 * draft kept on this device, or everyone present. Unsent changes are kept as
 * a draft so a dropped connection or a closed tab doesn't lose them.
 */
export function useRegisterEditor(input: RegisterInput | null) {
  const today = useToday();
  const online = useOnline();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const [submitRegister, { isLoading: submitting }] = useSubmitRegisterMutation();
  const roster = useRoster(input?.sectionId, input?.subjectId);
  const id = input ? registerId(input) : "";
  const saved = registers.find((r) => r.id === id);
  const locked = isLocked(saved, today, rules);
  const holiday = input ? holidayOn(input.date, rules) : null;
  const future = Boolean(input && today && input.date > today);

  // Edits since the last save, keyed by register so switching class or date starts clean.
  const [edits, setEdits] = useState<{ id: string; marks: Marks } | null>(null);
  const [notice, setNotice] = useState<{ ok?: string; error?: string } | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<string | null>(null);

  // Offer a draft saved on this device for this register, if it's newer than what's saved.
  // Browser storage is read only after hydration (today is null until then).
  const draft = id && today ? readJson<Draft>(DRAFT_PREFIX + id) : null;
  const draftIsNewer = Boolean(draft && (!saved || draft.savedAt > saved.submittedAt) && restoredDraft !== id && edits?.id !== id);

  const marks: Marks = edits?.id === id ? edits.marks : defaultMarks(roster, saved?.marks);
  const dirty = edits?.id === id;

  const update = (next: Marks) => {
    setEdits({ id, marks: next });
    setNotice(null);
    writeJson(DRAFT_PREFIX + id, { marks: next, savedAt: new Date().toISOString() } satisfies Draft);
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => update({ ...marks, [studentId]: { ...marks[studentId], status } });
  const markAll = (status: AttendanceStatus) => update(Object.fromEntries(roster.map((s) => [s.id, { status }])));
  const reset = () => {
    setEdits(null);
    setNotice(null);
    writeJson(DRAFT_PREFIX + id, null);
  };
  const restoreDraft = () => {
    if (!draft) return;
    setRestoredDraft(id);
    setEdits({ id, marks: { ...defaultMarks(roster, saved?.marks), ...draft.marks } });
    setNotice({ ok: "Unsent marks restored from this device." });
  };
  const discardDraft = () => {
    setRestoredDraft(id);
    writeJson(DRAFT_PREFIX + id, null);
  };

  const submit = async () => {
    if (!input) return;
    const payload = { ...input, marks };
    if (!online) {
      writeJson(OUTBOX_KEY, [...readOutbox().filter((r) => registerId(r) !== id), payload]);
      setNotice({ ok: "You're offline. The register is saved on this device and will be submitted when you're back online." });
      return;
    }
    const result = await submitRegister(payload);
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    writeJson(DRAFT_PREFIX + id, null);
    setEdits(null);
    const absent = Object.values(marks).filter((m) => m.status === "absent").length;
    setNotice({
      ok: saved?.reopened
        ? "Corrections saved and the register is locked again. Each change is in the change log."
        : `Register submitted: ${roster.length - absent} present${absent ? `, ${absent} absent` : ""}.`,
    });
  };

  return {
    id,
    roster,
    marks,
    saved,
    locked,
    holiday,
    future,
    dirty,
    online,
    submitting,
    notice,
    draftIsNewer,
    setStatus,
    markAll,
    reset,
    submit,
    restoreDraft,
    discardDraft,
    queued: Boolean(today) && readOutbox().some((r) => registerId(r) === id),
  };
}

/** Submits registers queued while offline as soon as the browser is back online. */
export function useOutboxFlush() {
  const online = useOnline();
  const [submitRegister] = useSubmitRegisterMutation();
  useEffect(() => {
    if (!online) return;
    const queued = readOutbox();
    if (queued.length === 0) return;
    let cancelled = false;
    (async () => {
      const remaining = [];
      for (const register of queued) {
        if (cancelled) return;
        const result = await submitRegister(register);
        if ("error" in result) remaining.push(register);
        else writeJson(DRAFT_PREFIX + registerId(register), null);
      }
      writeJson(OUTBOX_KEY, remaining.length ? remaining : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [online, submitRegister]);
}
