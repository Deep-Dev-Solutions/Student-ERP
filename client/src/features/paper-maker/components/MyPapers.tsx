"use client";

import Link from "next/link";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePortalTeacher } from "@/features/teacher-portal/hooks";
import { useGetPaperCatalogQuery, useGetPapersQuery } from "@/store/api";
import { paperDate, scopeNames, totalMarks } from "../helpers";
import { PaperStatusBadge } from "./PaperStatusBadge";

/** The teacher's own papers with their status and any note from the office. */
export function MyPapers() {
  const { staffId } = usePortalTeacher();
  const { data: papers = [] } = useGetPapersQuery();
  const { data: catalog } = useGetPaperCatalogQuery();
  const mine = papers.filter((p) => p.teacherId === staffId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Exam papers"
        description="Your papers: drafts, papers waiting to be printed, and any returned to you with a note."
        actions={
          <ButtonLink href="/teacher-portal/paper-maker/new">
            <Plus data-icon="inline-start" />
            New paper
          </ButtonLink>
        }
      />
      {mine.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={FileText} title="No papers yet" description="Make your first paper; you can save it as a draft at any step." />
        </Card>
      ) : (
        <ul className="space-y-2">
          {mine.map((p) => {
            const names = scopeNames(p, catalog);
            return (
              <li key={p.id}>
                <Link href={`/teacher-portal/paper-maker/${p.id}`} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  <Card className="gap-2 px-4 py-4 transition-colors group-hover:bg-muted/50 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {p.details.examName || "Untitled paper"}
                          <PaperStatusBadge status={p.status} />
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {[names.board, names.className, names.book].filter(Boolean).join(", ") || "Board not chosen yet"}
                          {p.questions.length ? `. ${p.questions.length} questions, ${totalMarks(p)} marks` : ""}
                          {p.details.date ? `. Exam on ${paperDate(p.details.date)}` : ""}
                        </p>
                      </div>
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    {p.status === "returned" && p.returnNote ? (
                      <p className="rounded-lg border border-warning/30 bg-warning-tint px-3 py-2 text-sm text-warning">
                        <span className="font-semibold">Returned: </span>
                        {p.returnNote}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
