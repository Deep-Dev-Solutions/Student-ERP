"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePortalTeacher } from "@/features/teacher-portal/hooks";
import { useGetPapersQuery } from "@/store/api";

/** The teacher's papers by status, on the portal home. */
export function MyPapersSummary() {
  const { staffId } = usePortalTeacher();
  const { data: papers = [] } = useGetPapersQuery();
  const mine = papers.filter((p) => p.teacherId === staffId);
  const count = (s: string) => mine.filter((p) => p.status === s).length;
  const stats = [
    { label: "Drafts", value: count("draft") },
    { label: "Waiting to print", value: count("submitted") },
    { label: "Printed", value: count("printed") },
    { label: "Returned to you", value: count("returned") },
  ];
  return (
    <Card className="gap-4 px-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FileText aria-hidden className="size-4 text-muted-foreground" />
          <Link href="/teacher-portal/paper-maker" className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
            Your exam papers
          </Link>
        </h2>
        <ButtonLink href="/teacher-portal/paper-maker/new" size="sm">
          <Plus data-icon="inline-start" />
          New paper
        </ButtonLink>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
