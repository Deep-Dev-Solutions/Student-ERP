"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/StatCard";
import { FormStatus } from "@/components/shared/FormFields";
import { Lock, LockOpen, ShieldCheck, CalendarOff, ArrowRight } from "lucide-react";
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { formatDate } from "@/lib/format";
import {
  errorMessage,
  useDecideUnlockMutation,
  useGetRegistersQuery,
  useGetSchoolRulesQuery,
  useGetSectionsQuery,
  useGetStudentsQuery,
  useGetTeachersQuery,
  useGetUnlockRequestsQuery,
  useLockRegistersMutation,
} from "@/store/api";
import type { AttendanceRegister } from "@/types";
import { holidayOn, isLocked, useRegisterPermissions } from "../hooks";
import { useRegisterSelection } from "../useRegisterSelection";
import { ReopenRegisterDialog } from "./ReopenRegisterDialog";

type RowState = "not_marked" | "open" | "locked" | "reopened";

const stateBadge: Record<RowState, { label: string; variant: "neutral" | "highlight" | "success" | "info" }> = {
  not_marked: { label: "Not marked", variant: "neutral" },
  open: { label: "Open", variant: "highlight" },
  locked: { label: "Locked", variant: "success" },
  reopened: { label: "Reopened", variant: "info" },
};

export function ReviewAndLock() {
  const readOnly = useReadOnly();
  const selection = useRegisterSelection();
  const { date, today } = selection;
  const perms = useRegisterPermissions(undefined);
  const classes = useBranchClasses();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: requests = [] } = useGetUnlockRequestsQuery();
  const [lockRegisters] = useLockRegistersMutation();
  const [decideUnlock] = useDecideUnlockMutation();
  const [reopen, setReopen] = useState<{ id: string; label: string } | null>(null);
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});

  const holiday = holidayOn(date, rules);
  const rows = classes
    .flatMap((cls) =>
      sections
        .filter((s) => s.classId === cls.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((section) => {
          const enrolled = students.filter((s) => s.sectionId === section.id && s.enrollment === "active").length;
          const register: AttendanceRegister | undefined = registers.find((r) => r.sectionId === section.id && r.date === date);
          const marks = Object.values(register?.marks ?? {});
          const state: RowState = !register ? "not_marked" : register.reopened ? "reopened" : isLocked(register, today, rules) ? "locked" : "open";
          return {
            id: section.id,
            name: `${cls.name}, section ${section.name}`,
            classId: cls.id,
            sectionId: section.id,
            teacher: teachers.find((t) => t.id === section.inchargeId)?.name,
            enrolled,
            register,
            state,
            present: marks.filter((m) => m.status === "present").length,
            absent: marks.filter((m) => m.status === "absent").length,
            leave: marks.filter((m) => m.status === "leave").length,
          };
        })
    )
    .filter((r) => r.enrolled > 0 || r.register);

  const marked = rows.filter((r) => r.register);
  const lockedCount = rows.filter((r) => r.state === "locked").length;
  const openRows = rows.filter((r) => r.state === "open");
  const presentTotal = marked.reduce((n, r) => n + r.present, 0);
  const markedTotal = marked.reduce((n, r) => n + r.present + r.absent + r.leave, 0);
  const rate = markedTotal ? Math.round((presentTotal / markedTotal) * 1000) / 10 : 0;
  const lockRule = !rules ? "" : rules.attendance.lockAfterHours === 0 ? "End of day" : `${rules.attendance.lockAfterHours} h after marking`;
  const pending = requests.filter((u) => u.status === "pending");
  const canLock = perms.canLock && !readOnly;

  const lock = async (ids: string[]) => {
    const result = await lockRegisters(ids);
    setNotice("error" in result ? { error: errorMessage(result.error) } : { ok: ids.length === 1 ? "Register locked." : `${ids.length} registers locked.` });
  };

  const decide = async (id: string, approve: boolean) => {
    const result = await decideUnlock({ id, approve });
    setNotice("error" in result ? { error: errorMessage(result.error) } : { ok: approve ? "Register reopened for the teacher to correct." : "Request declined." });
  };

  const markHref = (r: (typeof rows)[number]) => `/attendance?class=${r.classId}&section=${r.sectionId}${date !== today ? `&date=${date}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-44">
          <label htmlFor="review-date" className="mb-1.5 block text-sm font-medium">
            Date
          </label>
          <Input id="review-date" type="date" value={date} max={today ?? undefined} onChange={(e) => selection.setDate(e.target.value)} className="h-9 bg-card" />
        </div>
        {notice.ok || notice.error ? <FormStatus success={notice.ok} error={notice.error} /> : null}
      </div>

      {pending.length > 0 ? (
        <Card className="gap-3 px-5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold">Requests to reopen</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Teachers asking to correct a locked register.</p>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pending.map((u) => {
              const reg = registers.find((r) => r.id === u.registerId);
              const section = sections.find((s) => s.id === reg?.sectionId);
              const cls = classes.find((c) => c.id === section?.classId);
              return (
                <li key={u.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {cls?.name}, section {section?.name}
                      {reg ? ` on ${formatDate(reg.date)}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.requestedBy}: {u.reason}
                    </p>
                  </div>
                  {perms.canUnlock && !readOnly ? (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => decide(u.id, false)}>
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => decide(u.id, true)}>
                        Reopen
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Registers locked"
          value={`${lockedCount} of ${rows.length}`}
          footer={
            openRows.length > 0 ? (
              <Badge variant="highlight">{openRows.length} still open</Badge>
            ) : marked.length < rows.length ? (
              <Badge variant="neutral">{rows.length - marked.length} not marked</Badge>
            ) : (
              <Badge variant="success">All locked</Badge>
            )
          }
        />
        <StatCard label="Present" value={presentTotal} footer={`of ${markedTotal} marked`} />
        <StatCard label="Attendance rate" value={`${rate}%`} footer="Across marked sections" />
        <StatCard label="Registers lock" value={lockRule} footer="Set in Settings, School rules" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Class registers{date ? `, ${formatDate(date)}` : ""}</h2>
            <p className="text-sm text-muted-foreground">
              Check the counts, then lock each register so it can&apos;t be edited after the day ends.
            </p>
          </div>
          <Button onClick={() => lock(openRows.map((r) => r.register!.id))} disabled={!canLock || openRows.length === 0}>
            <ShieldCheck data-icon="inline-start" />
            Lock all open registers
          </Button>
        </div>

        {holiday ? (
          <p className="flex items-center gap-2 border-b border-border bg-info-tint px-5 py-3 text-sm text-info">
            <CalendarOff aria-hidden className="size-4" />
            No registers on {formatDate(date)}: {holiday}.
          </p>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Class</TableHead>
              <TableHead className="hidden xl:table-cell">Class incharge</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Enrolled</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Absent</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Leave</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const badge = stateBadge[r.state];
              return (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 whitespace-normal">
                    <Link
                      href={markHref(r)}
                      className="rounded font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {r.name}
                    </Link>
                    <p className="text-xs text-muted-foreground xl:hidden">{r.teacher ?? "No incharge"}</p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{r.teacher ?? "—"}</TableCell>
                  <TableCell className="hidden text-right lg:table-cell">{r.enrolled}</TableCell>
                  <TableCell className="text-right">{r.register ? r.present : "—"}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{r.register ? r.absent : "—"}</TableCell>
                  <TableCell className="hidden text-right lg:table-cell">{r.register ? r.leave : "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-0.5">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {r.register?.lockedAt && r.state === "locked" && r.register.lockedBy !== "End of day" ? (
                        <span className="hidden text-xs text-muted-foreground lg:block">by {r.register.lockedBy}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {r.state === "open" && canLock ? (
                      <Button size="sm" onClick={() => lock([r.register!.id])} aria-label={`Lock ${r.name}`}>
                        <Lock />
                        <span className="hidden lg:inline">Lock</span>
                      </Button>
                    ) : r.state === "locked" && perms.canUnlock && !readOnly ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReopen({ id: r.register!.id, label: `${r.name} on ${formatDate(date)}` })}
                        aria-label={`Reopen ${r.name}`}
                      >
                        <LockOpen />
                        <span className="hidden lg:inline">Reopen</span>
                      </Button>
                    ) : r.state === "not_marked" && !holiday ? (
                      <Link
                        href={markHref(r)}
                        aria-label={`Mark ${r.name}`}
                        className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <span className="hidden lg:inline">Mark</span>
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {reopen ? (
        <ReopenRegisterDialog
          registerId={reopen.id}
          label={reopen.label}
          canUnlock
          onClose={() => setReopen(null)}
          onDone={(text) => setNotice({ ok: text })}
        />
      ) : null}
    </div>
  );
}
