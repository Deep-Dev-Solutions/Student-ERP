"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrentBranch, usePermissionFlags } from "@/hooks/use-session";
import { useGetPapersQuery } from "@/store/api";

/** Exam papers at a glance, for schools with the paper maker. */
export function PapersCard() {
  const branch = useCurrentBranch();
  const { canPrintPapers } = usePermissionFlags();
  const { data: papers = [] } = useGetPapersQuery();
  const here = papers.filter((p) => p.branchId === branch?.id);
  const count = (s: string) => here.filter((p) => p.status === s).length;
  const stats = [
    { label: "Waiting to print", value: count("submitted") },
    { label: "Printed", value: count("printed") },
    { label: "Returned to teachers", value: count("returned") },
    { label: "Drafts", value: count("draft") },
  ];
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FileText aria-hidden className="size-4 text-muted-foreground" />
          Exam papers
        </h2>
        {canPrintPapers ? (
          <Link href="/papers" className="rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
            Open print queue
          </Link>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border px-3 py-2">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
