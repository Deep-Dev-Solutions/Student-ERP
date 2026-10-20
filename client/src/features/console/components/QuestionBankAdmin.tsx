"use client";

import { useState } from "react";
import { ChevronDown, Library, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { QUESTION_TYPES, typeLabel } from "@/features/paper-maker/helpers";
import { cn } from "@/lib/utils";
import type { CatalogKind } from "@/services/paper/contract";
import {
  errorMessage,
  useDeleteBankQuestionMutation,
  useDeleteCatalogItemMutation,
  useGetPaperCatalogQuery,
  useGetQuestionBankQuery,
  useSaveBankQuestionMutation,
  useSaveCatalogItemMutation,
} from "@/store/api";
import type { BankQuestion, PaperQuestionType } from "@/types";

const kindLabels: Record<CatalogKind, string> = { board: "board", class: "class", book: "book", chapter: "chapter", subTopic: "sub topic" };
const textareaClass = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

type NameDialogState = { kind: CatalogKind; id?: string; parentId?: string; name: string; extra?: string } | null;

/** Add or rename one catalogue node. */
function NameDialog({ state, onClose, onDone }: { state: NonNullable<NameDialogState>; onClose: () => void; onDone: (msg: string) => void }) {
  const [save, { isLoading }] = useSaveCatalogItemMutation();
  const [name, setName] = useState(state.name);
  const [extra, setExtra] = useState(state.extra ?? "");
  const [error, setError] = useState<string | null>(null);
  const extraLabel = state.kind === "board" ? "Short name" : state.kind === "book" ? "Subject" : null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await save({ kind: state.kind, id: state.id, parentId: state.parentId, name, extra });
            if ("error" in r) return setError(errorMessage(r.error));
            onClose();
            onDone(`${name.trim()} ${state.id ? "renamed" : "added"}.`);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {state.id ? "Rename" : "Add a"} {kindLabels[state.kind]}
            </DialogTitle>
            <DialogDescription>Changes apply to every school that has the paper maker.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField id="cat-name" label="Name" wrapperClassName={extraLabel ? "sm:col-span-2" : "sm:col-span-3"} value={name} onChange={(e) => setName(e.target.value)} />
            {extraLabel ? <TextField id="cat-extra" label={extraLabel} value={extra} onChange={(e) => setExtra(e.target.value)} /> : null}
          </div>
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              {state.id ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Draft = { id?: string; type: PaperQuestionType; text: string; options: string[]; answer: string };

/** Add or edit a bank question. */
function QuestionForm({ subTopicId, initial, onClose, onDone }: { subTopicId: string; initial?: BankQuestion; onClose: () => void; onDone: (msg: string) => void }) {
  const [save, { isLoading }] = useSaveBankQuestionMutation();
  const [q, setQ] = useState<Draft>(() => ({ id: initial?.id, type: initial?.type ?? "mcq", text: initial?.text ?? "", options: initial?.options ?? ["", "", "", ""], answer: initial?.answer ?? "A" }));
  const [error, setError] = useState<string | null>(null);
  const set = (c: Partial<Draft>) => setQ((x) => ({ ...x, ...c }));
  return (
    <form
      noValidate
      className="space-y-3 rounded-xl border border-primary bg-secondary/30 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await save({ id: q.id, subTopicId, type: q.type, text: q.text, options: q.type === "mcq" ? q.options : undefined, answer: q.answer });
        if ("error" in r) return setError(errorMessage(r.error));
        onClose();
        onDone(initial ? "Question saved." : "Question added.");
      }}
    >
      <SelectField
        id="bank-type"
        label="Type"
        className="sm:w-56"
        options={QUESTION_TYPES.map((t) => ({ value: t.type, label: t.label }))}
        value={q.type}
        onValueChange={(v) => set({ type: v as PaperQuestionType, answer: v === "mcq" ? "A" : "" })}
      />
      <div>
        <label htmlFor="bank-text" className="mb-1.5 block text-sm font-medium">
          Question
        </label>
        <textarea id="bank-text" rows={2} value={q.text} onChange={(e) => set({ text: e.target.value })} className={textareaClass} />
      </div>
      {q.type === "mcq" ? (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-sm font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                <Input aria-label={`Choice ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => set({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })} className="h-9 bg-card" />
              </div>
            ))}
          </div>
          <SelectField id="bank-answer" label="Correct choice" className="sm:w-48" options={["A", "B", "C", "D"].map((l) => ({ value: l, label: l }))} value={q.answer || "A"} onValueChange={(answer) => set({ answer })} />
        </>
      ) : (
        <div>
          <label htmlFor="bank-answer" className="mb-1.5 block text-sm font-medium">
            Model answer
          </label>
          <textarea id="bank-answer" rows={2} value={q.answer} onChange={(e) => set({ answer: e.target.value })} className={textareaClass} />
        </div>
      )}
      {error ? <FormStatus error={error} /> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isLoading}>
          {initial ? "Save question" : "Add question"}
        </Button>
      </div>
    </form>
  );
}

/** The global paper catalogue and question bank, shared by every school with the paper maker. */
export function QuestionBankAdmin() {
  const { data: catalog } = useGetPaperCatalogQuery();
  const { data: bank = [] } = useGetQuestionBankQuery();
  const [removeItem] = useDeleteCatalogItemMutation();
  const [removeQuestion] = useDeleteBankQuestionMutation();
  const [boardId, setBoardId] = useState("");
  const [classId, setClassId] = useState("");
  const [bookId, setBookId] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [topicId, setTopicId] = useState("");
  const [dialog, setDialog] = useState<NameDialogState>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  if (!catalog) return null;

  const board = catalog.boards.find((b) => b.id === boardId) ?? catalog.boards[0];
  const classes = catalog.classes.filter((c) => c.boardId === board?.id);
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const books = catalog.books.filter((b) => b.classId === cls?.id);
  const book = books.find((b) => b.id === bookId) ?? books[0];
  const chapters = catalog.chapters.filter((c) => c.bookId === book?.id).sort((a, b) => a.number - b.number);
  const topicsOf = (chapterId: string) => catalog.subTopics.filter((t) => t.chapterId === chapterId);
  const topic = catalog.subTopics.find((t) => t.id === topicId && chapters.some((c) => c.id === t.chapterId));
  const questions = topic ? bank.filter((q) => q.subTopicId === topic.id) : [];
  const done = (msg: string) => setNotice({ success: msg });
  const remove = async (kind: CatalogKind, id: string, name: string) => {
    const r = await removeItem({ kind, id });
    setNotice("error" in r ? { error: errorMessage(r.error) } : { success: `${name} deleted.` });
  };

  const levels: { kind: CatalogKind; label: string; value: string; options: { value: string; label: string }[]; set: (v: string) => void; parentId?: string; current?: { id: string; name: string; extra?: string } }[] = [
    { kind: "board", label: "Board", value: board?.id ?? "", options: catalog.boards.map((b) => ({ value: b.id, label: `${b.shortName}, ${b.name}` })), set: (v) => (setBoardId(v), setClassId(""), setBookId(""), setTopicId("")), current: board && { id: board.id, name: board.name, extra: board.shortName } },
    { kind: "class", label: "Class", value: cls?.id ?? "", options: classes.map((c) => ({ value: c.id, label: c.name })), set: (v) => (setClassId(v), setBookId(""), setTopicId("")), parentId: board?.id, current: cls && { id: cls.id, name: cls.name } },
    { kind: "book", label: "Book", value: book?.id ?? "", options: books.map((b) => ({ value: b.id, label: `${b.title} (${b.subject})` })), set: (v) => (setBookId(v), setTopicId("")), parentId: cls?.id, current: book && { id: book.id, name: book.title, extra: book.subject } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Question bank" description="The board, class, book and chapter catalogue and the questions teachers draw from. It's shared by every school with the paper maker." />
      {notice.success || notice.error ? (
        <div className={notice.error ? "" : "rounded-lg border border-success/30 bg-success-tint p-3"}>
          <FormStatus success={notice.success} error={notice.error} />
        </div>
      ) : null}

      <Card className="gap-5 px-5 sm:px-6">
        <div>
          <CardTitle>
            <h2>Catalogue</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            {catalog.boards.length} boards, {catalog.books.length} books, {bank.length} questions.
          </CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {levels.map((l) => (
            <div key={l.kind} className="space-y-2">
              {l.options.length ? <SelectField id={`cat-${l.kind}`} label={l.label} options={l.options} value={l.value} onValueChange={l.set} /> : <p className="text-sm font-medium">{l.label}: none yet</p>}
              <div className="flex flex-wrap gap-1">
                <Button variant="outline" size="sm" disabled={l.kind !== "board" && !l.parentId} onClick={() => setDialog({ kind: l.kind, parentId: l.parentId, name: "" })}>
                  <Plus data-icon="inline-start" />
                  Add {kindLabels[l.kind]}
                </Button>
                {l.current ? (
                  <>
                    <Button variant="ghost" size="icon-sm" aria-label={`Rename ${l.current.name}`} onClick={() => setDialog({ kind: l.kind, id: l.current!.id, name: l.current!.name, extra: l.current!.extra })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${l.current.name}`} onClick={() => remove(l.kind, l.current!.id, l.current!.name)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                      <Trash2 />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="gap-4 px-5 sm:px-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle>
              <h2>Chapters</h2>
            </CardTitle>
            <Button variant="outline" size="sm" disabled={!book} onClick={() => book && setDialog({ kind: "chapter", parentId: book.id, name: "" })}>
              <Plus data-icon="inline-start" />
              Add chapter
            </Button>
          </div>
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">{book ? "No chapters yet." : "Add a book first."}</p>
          ) : (
            <ul className="space-y-2">
              {chapters.map((ch) => {
                const expanded = open.has(ch.id);
                return (
                  <li key={ch.id} className="rounded-xl border border-border">
                    <div className="flex items-center gap-1 p-2.5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpen((s) => (s.has(ch.id) ? new Set([...s].filter((x) => x !== ch.id)) : new Set([...s, ch.id])))}
                        className="flex flex-1 items-center justify-between gap-2 rounded text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        {ch.number}. {ch.title}
                        <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                      </button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Rename chapter ${ch.title}`} onClick={() => setDialog({ kind: "chapter", id: ch.id, name: ch.title })}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete chapter ${ch.title}`} onClick={() => remove("chapter", ch.id, ch.title)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                        <Trash2 />
                      </Button>
                    </div>
                    {expanded ? (
                      <ul className="space-y-1 border-t border-border p-2">
                        {topicsOf(ch.id).map((t) => {
                          const n = bank.filter((q) => q.subTopicId === t.id).length;
                          return (
                            <li key={t.id}>
                              <button
                                type="button"
                                aria-current={topic?.id === t.id ? "true" : undefined}
                                onClick={() => {
                                  setTopicId(t.id);
                                  setEditing(null);
                                }}
                                className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40", topic?.id === t.id ? "bg-secondary font-medium" : "hover:bg-muted")}
                              >
                                {t.title}
                                <span className="text-xs text-muted-foreground">{n}</span>
                              </button>
                            </li>
                          );
                        })}
                        <li>
                          <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "subTopic", parentId: ch.id, name: "" })}>
                            <Plus data-icon="inline-start" />
                            Add sub topic
                          </Button>
                        </li>
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-4 px-5 sm:px-6 lg:col-span-3">
          {!topic ? (
            <EmptyState icon={Library} title="Pick a sub topic" description="Open a chapter and choose a sub topic to see and edit its questions." />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>
                    <h2>{topic.title}</h2>
                  </CardTitle>
                  <CardDescription className="mt-0.5">{questions.length} questions. Papers that already use a question keep their own copy.</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Rename sub topic ${topic.title}`} onClick={() => setDialog({ kind: "subTopic", id: topic.id, name: topic.title })}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete sub topic ${topic.title}`} onClick={() => remove("subTopic", topic.id, topic.title)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li key={q.id}>
                    {editing === q.id ? (
                      <QuestionForm subTopicId={topic.id} initial={q} onClose={() => setEditing(null)} onDone={done} />
                    ) : (
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                        <div className="min-w-0 space-y-1 text-sm">
                          <Badge variant="secondary">{typeLabel(q.type)}</Badge>
                          <p>{q.text}</p>
                          {q.options ? <p className="text-xs text-muted-foreground">{q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("  ")}</p> : null}
                          <p className="text-xs text-muted-foreground">Answer: {q.answer}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit question: ${q.text.slice(0, 40)}`} onClick={() => setEditing(q.id)}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete question: ${q.text.slice(0, 40)}`}
                            onClick={async () => {
                              const r = await removeQuestion(q.id);
                              setNotice("error" in r ? { error: errorMessage(r.error) } : { success: "Question deleted." });
                            }}
                            className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {editing === "new" ? (
                <QuestionForm subTopicId={topic.id} onClose={() => setEditing(null)} onDone={done} />
              ) : (
                <Button variant="outline" className="self-start" onClick={() => setEditing("new")}>
                  <Plus data-icon="inline-start" />
                  Add question
                </Button>
              )}
            </>
          )}
        </Card>
      </div>

      {dialog ? <NameDialog state={dialog} onClose={() => setDialog(null)} onDone={done} /> : null}
    </div>
  );
}
