"use client";

import { useGetCampusProfileQuery, useGetPaperCatalogQuery } from "@/store/api";
import type { PaperDraftInput } from "@/types";
import { paperDate, QUESTION_TYPES, scopeNames, totalMarks } from "../helpers";

/**
 * The paper as students will see it, with the school's name and logo from
 * Settings → Institute. With answerKey, it lists the answers instead.
 */
export function PaperPreview({ paper, answerKey = false }: { paper: Pick<PaperDraftInput, "boardId" | "classId" | "bookId" | "questions" | "details">; answerKey?: boolean }) {
  const profile = useGetCampusProfileQuery().data;
  const { data: catalog } = useGetPaperCatalogQuery();
  const names = scopeNames(paper, catalog);
  const initials = profile?.schoolName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  let number = 0;

  return (
    <article className="space-y-5 text-sm">
      <header className="space-y-3 border-b-2 border-foreground pb-4 text-center">
        <div className="flex items-center justify-center gap-3">
          {profile?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoUrl} alt="" className="size-12 rounded-lg object-contain" />
          ) : (
            <span aria-hidden className="flex size-12 items-center justify-center rounded-lg border border-foreground text-lg font-semibold">
              {initials}
            </span>
          )}
          <div className="text-left">
            <p className="text-lg font-semibold leading-tight">{profile?.schoolName}</p>
            <p className="text-xs text-muted-foreground">{profile ? `${profile.city}. ${profile.contactPhone}` : ""}</p>
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold">
            {paper.details.examName || "Exam name"}
            {answerKey ? ": answer key" : ""}
          </h2>
          <p className="text-muted-foreground">{[names.className, names.book, names.board].filter(Boolean).join(", ")}</p>
        </div>
        <dl className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">{paperDate(paper.details.date) || "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Time allowed</dt>
            <dd className="font-medium">{paper.details.timeAllowed || "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Total marks</dt>
            <dd className="font-medium">{totalMarks(paper)}</dd>
          </div>
        </dl>
      </header>
      {!answerKey ? (
        <>
          <div className="grid grid-cols-2 gap-6 text-muted-foreground">
            <p className="border-b border-foreground/40 pb-1">Name</p>
            <p className="border-b border-foreground/40 pb-1">Roll no.</p>
          </div>
          {paper.details.instructions ? <p className="italic">{paper.details.instructions}</p> : null}
        </>
      ) : null}
      {QUESTION_TYPES.map(({ type, label, section, heading }) => {
        const list = paper.questions.filter((q) => q.type === type);
        if (list.length === 0) return null;
        return (
          <section key={type} className="space-y-3">
            <h3 className="flex items-baseline justify-between gap-3 border-b border-border pb-1 font-semibold">
              <span>
                Section {section}: {label}
              </span>
              {!answerKey ? <span className="text-xs font-normal text-muted-foreground">{heading}</span> : null}
            </h3>
            <ol className="space-y-3">
              {list.map((q) => {
                number++;
                return (
                  <li key={q.id} className="flex gap-3 break-inside-avoid">
                    <span className="w-6 shrink-0 font-semibold tabular-nums">{number}.</span>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between gap-4">
                        <p className="leading-relaxed">{q.text}</p>
                        {!answerKey ? <span className="shrink-0 text-xs text-muted-foreground">({q.marks})</span> : null}
                      </div>
                      {q.options && !answerKey ? (
                        <ol className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 print:grid-cols-2">
                          {q.options.map((o, i) => (
                            <li key={i}>
                              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {o}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {answerKey ? (
                        <p className="font-medium">
                          {q.type === "mcq" ? `${q.answer}. ${q.options?.[q.answer.charCodeAt(0) - 65] ?? ""}` : q.answer || "No model answer given."}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      {paper.questions.length === 0 ? <p className="text-muted-foreground">No questions yet.</p> : null}
    </article>
  );
}
