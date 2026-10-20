"use client";

import { useState } from "react";
import { Pencil, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormStatus, SelectField } from "@/components/shared/FormFields";
import type { PaperQuestion, PaperQuestionType } from "@/types";
import { QUESTION_TYPES, totalMarks, typeLabel } from "../helpers";
import type { PaperWizard } from "../usePaperWizard";

const textareaClass = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const numberOnly = (v: string) => Number(v.replace(/\D/g, "")) || 0;

type Editable = Omit<PaperQuestion, "id">;

/** Edit a question's text, choices, answer and marks. */
function QuestionEditor({ initial, onSave, onCancel, saveLabel, allowType = false }: { initial: Editable; onSave: (q: Editable) => void; onCancel: () => void; saveLabel: string; allowType?: boolean }) {
  const [q, setQ] = useState<Editable>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (changes: Partial<Editable>) => setQ((x) => ({ ...x, ...changes }));
  const setType = (type: PaperQuestionType) => set({ type, options: type === "mcq" ? (q.options ?? ["", "", "", ""]) : undefined, answer: type === "mcq" ? "A" : "" });
  const save = () => {
    if (q.text.trim().length < 5) return setError("Write the question.");
    if (q.type === "mcq" && (q.options ?? []).some((o) => !o.trim())) return setError("Fill in all four choices.");
    if (q.marks <= 0) return setError("Give the question at least 1 mark.");
    onSave({ ...q, text: q.text.trim(), answer: q.answer.trim(), options: q.options?.map((o) => o.trim()) });
  };
  const idBase = `edit-${initial.bankId ?? "new"}-${initial.type}`;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {allowType ? (
          <SelectField id={`${idBase}-type`} label="Type" options={QUESTION_TYPES.map((t) => ({ value: t.type, label: t.label }))} value={q.type} onValueChange={(v) => setType(v as PaperQuestionType)} />
        ) : null}
        <div>
          <label htmlFor={`${idBase}-marks`} className="mb-1.5 block text-sm font-medium">
            Marks
          </label>
          <Input id={`${idBase}-marks`} inputMode="numeric" value={String(q.marks)} onChange={(e) => set({ marks: numberOnly(e.target.value) })} className="h-9 bg-card tabular-nums" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idBase}-text`} className="mb-1.5 block text-sm font-medium">
          Question
        </label>
        <textarea id={`${idBase}-text`} rows={2} value={q.text} onChange={(e) => set({ text: e.target.value })} className={textareaClass} />
      </div>
      {q.type === "mcq" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(q.options ?? ["", "", "", ""]).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 text-sm font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              <Input
                aria-label={`Choice ${String.fromCharCode(65 + i)}`}
                value={o}
                onChange={(e) => set({ options: (q.options ?? ["", "", "", ""]).map((x, j) => (j === i ? e.target.value : x)) })}
                className="h-9 bg-card"
              />
            </div>
          ))}
        </div>
      ) : null}
      {q.type === "mcq" ? (
        <SelectField id={`${idBase}-answer`} label="Correct choice" className="sm:w-48" options={["A", "B", "C", "D"].map((l) => ({ value: l, label: l }))} value={q.answer || "A"} onValueChange={(answer) => set({ answer })} />
      ) : (
        <div>
          <label htmlFor={`${idBase}-answer`} className="mb-1.5 block text-sm font-medium">
            Model answer (for the answer key)
          </label>
          <textarea id={`${idBase}-answer`} rows={2} value={q.answer} onChange={(e) => set({ answer: e.target.value })} className={textareaClass} />
        </div>
      )}
      {error ? <FormStatus error={error} /> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

export function QuestionsStep({ wizard }: { wizard: PaperWizard }) {
  const { draft } = wizard;
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const available = (type: PaperQuestionType) => wizard.scope.pool.filter((q) => q.type === type).length;
  const setRow = (type: PaperQuestionType, changes: Partial<{ count: number; marks: number }>) =>
    wizard.setBlueprint(QUESTION_TYPES.map(({ type: t }) => {
      const row = draft.blueprint.find((r) => r.type === t) ?? { type: t, count: 0, marks: 1 };
      return t === type ? { ...row, ...changes } : row;
    }));
  const planned = draft.blueprint.reduce((n, r) => n + r.count * r.marks, 0);
  let number = 0;

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-5 sm:px-6">
        <div>
          <CardTitle>
            <h2>Question types and marks</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Choose how many of each type and the marks for each, then draw questions from your chapters.</CardDescription>
        </div>
        <div className="-mx-5 sm:-mx-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 sm:pl-6">Type</TableHead>
                <TableHead className="text-right">How many</TableHead>
                <TableHead className="text-right">Marks each</TableHead>
                <TableHead className="hidden text-right sm:table-cell">In the bank</TableHead>
                <TableHead className="pr-5 text-right sm:pr-6">Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUESTION_TYPES.map(({ type, label }) => {
                const row = draft.blueprint.find((r) => r.type === type) ?? { type, count: 0, marks: 1 };
                return (
                  <TableRow key={type}>
                    <TableCell className="pl-5 font-medium whitespace-normal sm:pl-6">{label}</TableCell>
                    <TableCell className="text-right">
                      <Input aria-label={`How many ${label.toLowerCase()} questions`} inputMode="numeric" value={String(row.count)} onChange={(e) => setRow(type, { count: Math.min(50, numberOnly(e.target.value)) })} className="ml-auto h-9 w-16 bg-card text-right tabular-nums" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input aria-label={`Marks for each ${label.toLowerCase()} question`} inputMode="numeric" value={String(row.marks)} onChange={(e) => setRow(type, { marks: Math.min(100, numberOnly(e.target.value)) })} className="ml-auto h-9 w-16 bg-card text-right tabular-nums" />
                    </TableCell>
                    <TableCell className={`hidden text-right tabular-nums sm:table-cell ${available(type) < row.count ? "font-medium text-danger" : "text-muted-foreground"}`}>{available(type)}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums sm:pr-6">{row.count * row.marks}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus success={wizard.notice.success} error={wizard.notice.error} idle={`${planned} marks planned.`} />
          <Button type="button" onClick={wizard.drawQuestions} disabled={draft.blueprint.every((r) => r.count === 0)}>
            <Shuffle data-icon="inline-start" />
            {draft.questions.some((q) => !q.custom) ? "Draw again" : "Draw questions"}
          </Button>
        </div>
      </Card>

      <Card className="gap-5 px-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              <h2>Review the questions</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Swap any question for another from your chapters, edit it, or add your own.</CardDescription>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{draft.questions.length}</span> questions · <span className="font-semibold text-foreground">{totalMarks(draft)}</span> marks
          </p>
        </div>

        {draft.questions.length === 0 ? <p className="text-sm text-muted-foreground">No questions yet. Draw some above or add your own.</p> : null}

        {QUESTION_TYPES.map(({ type, label }) => {
          const list = draft.questions.filter((q) => q.type === type);
          if (list.length === 0) return null;
          return (
            <section key={type} className="space-y-3">
              <h3 className="text-sm font-semibold">{label}</h3>
              <ol className="space-y-3">
                {list.map((q) => {
                  number++;
                  const n = number;
                  const canSwap = wizard.swapOptions(q).length > 0;
                  return (
                    <li key={q.id} className="rounded-xl border border-border bg-card p-4">
                      {editing === q.id ? (
                        <QuestionEditor
                          initial={q}
                          saveLabel="Save question"
                          onCancel={() => setEditing(null)}
                          onSave={(changes) => {
                            wizard.editQuestion(q.id, changes);
                            setEditing(null);
                          }}
                        />
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-semibold">Question {n}</span>
                              <Badge variant="secondary">{typeLabel(q.type)}</Badge>
                              {q.custom ? <Badge variant="info">Your question</Badge> : null}
                              <span className="text-muted-foreground">
                                {q.marks} {q.marks === 1 ? "mark" : "marks"}
                              </span>
                            </div>
                            <p className="leading-relaxed">{q.text}</p>
                            {q.options ? (
                              <ol className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2" type="A">
                                {q.options.map((opt, i) => (
                                  <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
                                    <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                  </li>
                                ))}
                              </ol>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-1 self-end sm:self-start">
                            {!q.custom ? (
                              <Button variant="outline" size="sm" onClick={() => wizard.swap(q.id)} disabled={!canSwap} aria-label={`Swap question ${n}`} title={canSwap ? undefined : "No other question of this type in your chapters"}>
                                <RefreshCw data-icon="inline-start" />
                                Swap
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="icon-sm" aria-label={`Edit question ${n}`} onClick={() => setEditing(q.id)}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon-sm" aria-label={`Remove question ${n}`} onClick={() => wizard.removeQuestion(q.id)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}

        {adding ? (
          <div className="rounded-xl border border-primary bg-secondary/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">Your own question</h3>
            <QuestionEditor
              allowType
              initial={{ type: "short", text: "", answer: "", marks: 3, custom: true }}
              saveLabel="Add question"
              onCancel={() => setAdding(false)}
              onSave={(q) => {
                wizard.addQuestion(q);
                setAdding(false);
              }}
            />
          </div>
        ) : (
          <Button type="button" variant="outline" className="self-start" onClick={() => setAdding(true)}>
            <Plus data-icon="inline-start" />
            Add my own question
          </Button>
        )}
      </Card>
    </div>
  );
}
