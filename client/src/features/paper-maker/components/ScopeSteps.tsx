"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import { useGetPaperCatalogQuery } from "@/store/api";
import type { PaperWizard } from "../usePaperWizard";

const choiceClass = (selected: boolean) =>
  cn(
    "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
    selected ? "border-primary bg-secondary/50" : "border-border bg-card hover:bg-muted/60"
  );

/** One choice from a list (board, class or book), as selectable cards. */
function ChoiceStep({
  title,
  description,
  label,
  options,
  value,
  onChoose,
  empty,
}: {
  title: string;
  description: string;
  label: string;
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChoose: (value: string) => void;
  empty: string;
}) {
  return (
    <Card className="gap-6 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">{description}</CardDescription>
      </div>
      {options.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nothing to choose yet" description={empty} />
      ) : (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button key={o.value} type="button" role="radio" aria-checked={selected} onClick={() => onChoose(o.value)} className={choiceClass(selected)}>
                <span aria-hidden className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-input")}>
                  {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  {o.hint ? <span className="block text-xs text-muted-foreground">{o.hint}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function BoardStep({ wizard }: { wizard: PaperWizard }) {
  const { data: catalog } = useGetPaperCatalogQuery();
  return (
    <ChoiceStep
      title="Choose the board"
      description="The textbook board decides which classes, books and chapters you can pick."
      label="Board"
      options={(catalog?.boards ?? []).map((b) => ({ value: b.id, label: b.shortName, hint: b.name }))}
      value={wizard.draft.boardId}
      onChoose={wizard.chooseBoard}
      empty="No boards are set up yet."
    />
  );
}

export function ClassStep({ wizard }: { wizard: PaperWizard }) {
  return (
    <ChoiceStep
      title="Choose the class"
      description="Only classes this board publishes books for are shown."
      label="Class"
      options={wizard.scope.classes.map((c) => ({ value: c.id, label: c.name }))}
      value={wizard.draft.classId}
      onChoose={wizard.chooseClass}
      empty="This board has no classes yet."
    />
  );
}

export function BookStep({ wizard }: { wizard: PaperWizard }) {
  return (
    <ChoiceStep
      title="Choose the subject or book"
      description="Only books for this board and class are shown."
      label="Book"
      options={wizard.scope.books.map((b) => ({ value: b.id, label: b.title, hint: b.subject }))}
      value={wizard.draft.bookId}
      onChoose={wizard.chooseBook}
      empty="This class has no books yet."
    />
  );
}

/** Chapters with their sub topics: pick a whole chapter or single sub topics. */
export function ChaptersStep({ wizard }: { wizard: PaperWizard }) {
  const { chapters, subTopics } = wizard.scope;
  const picked = new Set(wizard.draft.subTopicIds);
  const topicsOf = (chapterId: string) => subTopics.filter((t) => t.chapterId === chapterId);
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(chapters.filter((c) => topicsOf(c.id).some((t) => picked.has(t.id)) && !topicsOf(c.id).every((t) => picked.has(t.id))).map((c) => c.id))
  );
  const allIds = chapters.flatMap((c) => topicsOf(c.id).map((t) => t.id));
  const allPicked = allIds.length > 0 && allIds.every((id) => picked.has(id));
  const chaptersPicked = chapters.filter((c) => topicsOf(c.id).some((t) => picked.has(t.id))).length;

  const setChapter = (chapterId: string, on: boolean) => {
    const ids = topicsOf(chapterId).map((t) => t.id);
    wizard.setSubTopics(on ? [...new Set([...wizard.draft.subTopicIds, ...ids])] : wizard.draft.subTopicIds.filter((id) => !ids.includes(id)));
  };
  const setTopic = (id: string, on: boolean) => wizard.setSubTopics(on ? [...wizard.draft.subTopicIds, id] : wizard.draft.subTopicIds.filter((x) => x !== id));
  const toggleOpen = (id: string) => setOpen((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  return (
    <Card className="gap-6 px-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>
            <h2>Chapters and sub topics</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Questions are drawn only from what you pick. Pick at least one.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => wizard.setSubTopics(allPicked ? [] : allIds)}>
          {allPicked ? "Clear all" : "Select all"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {wizard.draft.subTopicIds.length} sub topics picked across {chaptersPicked} of {chapters.length} chapters
      </p>
      <ul className="space-y-2">
        {chapters.map((ch) => {
          const topics = topicsOf(ch.id);
          const count = topics.filter((t) => picked.has(t.id)).length;
          const state = count === 0 ? "none" : count === topics.length ? "all" : "some";
          const expanded = open.has(ch.id);
          const listId = `topics-${ch.id}`;
          return (
            <li key={ch.id} className={cn("rounded-xl border transition-colors", state === "none" ? "border-border bg-card" : "border-primary bg-secondary/50")}>
              <div className="flex items-center gap-3 p-3.5">
                <Checkbox
                  checked={state === "all"}
                  indeterminate={state === "some"}
                  onCheckedChange={() => setChapter(ch.id, state !== "all")}
                  aria-label={`Chapter ${ch.number}, ${ch.title}`}
                />
                <button type="button" onClick={() => toggleOpen(ch.id)} aria-expanded={expanded} aria-controls={listId} className="flex flex-1 items-center justify-between gap-3 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  <span>
                    <span className="block text-sm font-medium">
                      {ch.number}. {ch.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {count} of {topics.length} sub topics
                    </span>
                  </span>
                  <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </button>
              </div>
              {expanded ? (
                <ul id={listId} className="space-y-2 border-t border-border px-3.5 py-3 pl-10">
                  {topics.map((t) => (
                    <li key={t.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <Checkbox checked={picked.has(t.id)} onCheckedChange={(c) => setTopic(t.id, Boolean(c))} />
                        {t.title}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
