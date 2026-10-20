"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { SelectField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCurrentBranch, usePermissionFlags } from "@/hooks/use-session";
import { useGetPaperCatalogQuery, useGetPapersQuery } from "@/store/api";
import type { PaperStatus } from "@/types";
import { paperDate, scopeNames } from "../helpers";
import { PaperStatusBadge } from "./PaperStatusBadge";

const filters: { value: PaperStatus | "all"; label: string }[] = [
  { value: "submitted", label: "Waiting to print" },
  { value: "printed", label: "Printed" },
  { value: "returned", label: "Returned to teacher" },
  { value: "all", label: "All" },
];

/** Shown when the user lacks the print permission. Hiding is for the UI; the API refuses too. */
export function NoPrintAccess() {
  return (
    <Card className="py-0">
      <EmptyState icon={Lock} title="You can't print exam papers" description="Printing is limited to staff with the print permission. Ask the school admin if you need it." />
    </Card>
  );
}

export function PrintQueue() {
  const { canPrintPapers } = usePermissionFlags();
  const branch = useCurrentBranch();
  const { data: papers = [] } = useGetPapersQuery();
  const { data: catalog } = useGetPaperCatalogQuery();
  const [status, setStatus] = useState<PaperStatus | "all">("submitted");
  const list = papers
    .filter((p) => p.branchId === branch?.id && p.status !== "draft" && (status === "all" || p.status === status))
    .sort((a, b) => (a.details.date || "9").localeCompare(b.details.date || "9"));

  return (
    <div className="space-y-6">
      <PageHeader title="Print queue" description="Exam papers teachers have submitted. Print them, or return them with a note." />
      {!canPrintPapers ? (
        <NoPrintAccess />
      ) : (
        <Card className="gap-0 py-0">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Papers</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {papers.filter((p) => p.branchId === branch?.id && p.status === "submitted").length} waiting to be printed. Soonest exam first.
              </p>
            </div>
            <SelectField id="queue-status" label="Show" className="sm:w-56" options={filters} value={status} onValueChange={(v) => setStatus(v as PaperStatus | "all")} />
          </div>
          {list.length === 0 ? (
            <EmptyState icon={Printer} title="Nothing here" description={status === "submitted" ? "No papers are waiting to be printed." : "No papers match this filter."} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Paper</TableHead>
                  <TableHead className="hidden lg:table-cell">Teacher</TableHead>
                  <TableHead className="hidden lg:table-cell">Board</TableHead>
                  <TableHead className="hidden xl:table-cell">Class</TableHead>
                  <TableHead className="hidden lg:table-cell">Subject</TableHead>
                  <TableHead className="hidden sm:table-cell">Exam date</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => {
                  const names = scopeNames(p, catalog);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="min-w-44 pl-5 whitespace-normal">
                        <Link href={`/papers/${p.id}`} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                          {p.details.examName}
                        </Link>
                        <p className="text-xs text-muted-foreground xl:hidden">
                          {names.className}, {names.book}
                          <span className="lg:hidden">. {p.teacherName}</span>
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{p.teacherName}</TableCell>
                      <TableCell className="hidden lg:table-cell">{names.board}</TableCell>
                      <TableCell className="hidden xl:table-cell">{names.className}</TableCell>
                      <TableCell className="hidden lg:table-cell">{names.subject}</TableCell>
                      <TableCell className="hidden sm:table-cell">{paperDate(p.details.date)}</TableCell>
                      <TableCell className="pr-5">
                        <PaperStatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
