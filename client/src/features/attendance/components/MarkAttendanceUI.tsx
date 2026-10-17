"use client";

import { useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2, CalendarOff, Lock, LockOpen, WifiOff, History, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { useGetUnlockRequestsQuery } from "@/store/api";
import type { AttendanceStatus } from "@/types";
import { useRegisterPermissions } from "../hooks";
import { useRegisterEditor } from "../useRegisterEditor";
import { useRegisterSelection } from "../useRegisterSelection";
import { ReopenRegisterDialog } from "./ReopenRegisterDialog";

const statusOptions: {
  value: AttendanceStatus;
  /** Shown on the button and used as the keyboard shortcut: P, A or L. */
  letter: string;
  label: string;
  checked: string;
  hover: string;
}[] = [
  { value: "present", letter: "P", label: "Present", checked: "bg-success text-success-foreground", hover: "hover:bg-success-tint hover:text-success" },
  { value: "absent", letter: "A", label: "Absent", checked: "bg-danger text-danger-foreground", hover: "hover:bg-danger-tint hover:text-danger" },
  { value: "leave", letter: "L", label: "Leave", checked: "bg-warning text-warning-foreground", hover: "hover:bg-warning-tint hover:text-warning" },
];

const statusLabel = (s: AttendanceStatus) => statusOptions.find((o) => o.value === s)?.label ?? s;

/** A notice above the register, in the same style as the rest of the app's notices. */
function Notice({ tone, icon: Icon, children, action }: { tone: "warning" | "info" | "danger" | "success"; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; action?: React.ReactNode }) {
  const tones = {
    warning: "border-warning/30 bg-warning-tint text-warning",
    info: "border-info/30 bg-info-tint text-info",
    danger: "border-danger/30 bg-danger-tint text-danger",
    success: "border-success/30 bg-success-tint text-success",
  };
  return (
    <div role="status" className={`flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${tones[tone]}`}>
      <p className="flex items-start gap-2">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
      </p>
      {action}
    </div>
  );
}

export function MarkAttendanceUI() {
  const readOnly = useReadOnly();
  const branch = useCurrentBranch();
  const selection = useRegisterSelection();
  const perms = useRegisterPermissions(selection.sectionId, selection.subjectId);
  const subjectWise = perms.mode === "subject_wise";
  const editor = useRegisterEditor(
    branch && selection.sectionId && selection.date
      ? {
          branchId: branch.id,
          classId: selection.classId,
          sectionId: selection.sectionId,
          date: selection.date,
          ...(subjectWise && selection.subjectId ? { subjectId: selection.subjectId } : {}),
        }
      : null
  );
  const { data: unlockRequests = [] } = useGetUnlockRequestsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [reopening, setReopening] = useState(false);
  const [dialogNotice, setDialogNotice] = useState<string | null>(null);
  const rowsRef = useRef<HTMLTableSectionElement>(null);

  const blocked = Boolean(editor.holiday) || editor.future;
  const canEdit = perms.canMark && !editor.locked && !blocked && !readOnly;
  const pendingRequest = unlockRequests.find((u) => u.registerId === editor.id && u.status === "pending");
  const placeLabel = `${selection.selectedClass?.name ?? ""}, section ${selection.selectedSection?.name ?? ""}${selection.date ? ` on ${formatDate(selection.date)}` : ""}`;

  const count = (status: AttendanceStatus) => editor.roster.filter((s) => editor.marks[s.id]?.status === status).length;
  const tally = [
    { label: "Present", count: count("present"), dot: "bg-success" },
    { label: "Absent", count: count("absent"), dot: "bg-danger" },
    { label: "On leave", count: count("leave"), dot: "bg-warning" },
  ];

  const query = searchQuery.toLowerCase();
  const filteredStudents = editor.roster.filter(
    (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
  );

  /** P, A and L mark the focused row and move to the next one; arrow keys move between rows. */
  const handleRowKeys = (e: React.KeyboardEvent, index: number, studentId: string) => {
    const key = e.key.toLowerCase();
    const option = statusOptions.find((o) => o.letter.toLowerCase() === key);
    const focusRow = (i: number) => {
      const groups = rowsRef.current?.querySelectorAll<HTMLElement>("[role=radiogroup]");
      const target = groups?.[i];
      if (!target) return;
      (target.querySelector<HTMLElement>("[aria-checked=true]") ?? target.querySelector<HTMLElement>("button"))?.focus();
    };
    if (option && canEdit) {
      e.preventDefault();
      editor.setStatus(studentId, option.value);
      requestAnimationFrame(() => focusRow(index + 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusRow(index - 1);
    }
  };

  const filterSelects = [
    { id: "mark-class", label: "Class", items: selection.classOptions, value: selection.classId, set: selection.setClassId, width: "w-36" },
    { id: "mark-section", label: "Section", items: selection.sectionOptions, value: selection.sectionId, set: selection.setSectionId, width: "w-36" },
    ...(subjectWise
      ? [{ id: "mark-subject", label: "Subject", items: selection.subjectOptions, value: selection.subjectId, set: selection.setSubjectId, width: "w-44" }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          {filterSelects.map((f) => (
            <div key={f.id} className={f.width}>
              <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium">
                {f.label}
              </label>
              <Select items={f.items} value={f.value} onValueChange={(val) => val && f.set(val)}>
                <SelectTrigger id={f.id} className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.items.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="w-44">
            <label htmlFor="mark-date" className="mb-1.5 block text-sm font-medium">
              Date
            </label>
            <Input
              id="mark-date"
              type="date"
              value={selection.date}
              max={selection.today ?? undefined}
              onChange={(e) => selection.setDate(e.target.value)}
              className="h-9 bg-card"
            />
          </div>

          <div className="min-w-52 flex-1">
            <label htmlFor="mark-search" className="mb-1.5 block text-sm font-medium">
              Find a student
            </label>
            <div className="relative">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mark-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or roll ID"
                className="h-9 bg-card pl-9"
              />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={() => editor.markAll("present")} disabled={!canEdit}>
          Mark all present
        </Button>
      </div>

      {!editor.online ? (
        <Notice tone="warning" icon={WifiOff}>
          You&apos;re offline. Keep marking: the register is saved on this device and submitted when the connection is back.
        </Notice>
      ) : null}
      {editor.holiday ? (
        <Notice tone="info" icon={CalendarOff}>
          No register on {formatDate(selection.date)}: {editor.holiday}.
        </Notice>
      ) : editor.future ? (
        <Notice tone="info" icon={CalendarOff}>
          Registers can&apos;t be marked ahead of the day.
        </Notice>
      ) : null}
      {!blocked && !perms.canMark && perms.reason ? (
        <Notice tone="info" icon={Lock}>
          {perms.reason} You can still view it.
        </Notice>
      ) : null}
      {editor.locked && !blocked ? (
        <Notice
          tone="warning"
          icon={Lock}
          action={
            pendingRequest ? (
              <span className="text-sm">A request to reopen is waiting for a branch admin.</span>
            ) : !readOnly && (perms.canUnlock || perms.canMark) ? (
              <Button variant="outline" size="sm" onClick={() => setReopening(true)}>
                <LockOpen data-icon="inline-start" />
                {perms.canUnlock ? "Reopen to correct" : "Ask to reopen"}
              </Button>
            ) : null
          }
        >
          This register is locked
          {editor.saved?.lockedAt && editor.saved.lockedBy !== "End of day"
            ? ` (by ${editor.saved.lockedBy})`
            : " at the end of the school day"}
          . Changes need a branch admin to reopen it, with a reason.
        </Notice>
      ) : null}
      {editor.saved?.reopened ? (
        <Notice tone="info" icon={LockOpen}>
          Reopened by {editor.saved.reopened.by}: {editor.saved.reopened.reason}. Submitting saves each change with this reason and locks the register again.
        </Notice>
      ) : null}
      {editor.draftIsNewer && canEdit ? (
        <Notice
          tone="info"
          icon={History}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={editor.discardDraft}>
                Discard
              </Button>
              <Button size="sm" onClick={editor.restoreDraft}>
                Restore
              </Button>
            </div>
          }
        >
          This device has marks for this register that weren&apos;t submitted.
        </Notice>
      ) : null}
      {dialogNotice ? (
        <Notice tone="success" icon={CheckCircle2}>
          {dialogNotice}
        </Notice>
      ) : null}

      <dl className="grid grid-cols-3 gap-3">
        {tally.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden className={`size-2.5 rounded-full ${t.dot}`} />
              {t.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{t.count}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {editor.roster.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No students in this section"
            description={subjectWise ? "No one in this section takes this subject." : "Admit students or move them into this section first."}
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No students match"
            description="Check the spelling or search by roll ID."
            action={
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden pl-5 md:table-cell">Roll ID</TableHead>
                <TableHead className="pl-5 md:pl-3">Student</TableHead>
                <TableHead className="hidden lg:table-cell">Remark</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody ref={rowsRef}>
              {filteredStudents.map((student, index) => {
                const mark = editor.marks[student.id];
                return (
                  <TableRow key={student.id}>
                    <TableCell className="hidden pl-5 text-muted-foreground md:table-cell">{student.id}</TableCell>

                    <TableCell className="pl-5 md:pl-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="hidden size-9 shrink-0 sm:flex items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                        >
                          {student.avatar}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">{student.admissionNo}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground lg:table-cell">{mark?.remark || "—"}</TableCell>

                    <TableCell className="pr-5 text-right">
                      <div
                        role="radiogroup"
                        aria-label={`Attendance for ${student.name}`}
                        onKeyDown={(e) => handleRowKeys(e, index, student.id)}
                        className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5"
                      >
                        {statusOptions.map((opt) => {
                          const checked = mark?.status === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="radio"
                              aria-checked={checked}
                              aria-label={opt.label}
                              title={`${opt.label} (${opt.letter})`}
                              onClick={() => editor.setStatus(student.id, opt.value)}
                              disabled={!canEdit}
                              className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                                checked ? opt.checked : `text-muted-foreground ${opt.hover}`
                              }`}
                            >
                              {opt.letter}
                            </button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            {editor.notice?.error ? (
              <>
                <AlertCircle aria-hidden className="size-4 text-danger" />
                <span className="text-danger">{editor.notice.error}</span>
              </>
            ) : editor.notice?.ok ? (
              <>
                <CheckCircle2 aria-hidden className="size-4 text-success" />
                {editor.notice.ok}
              </>
            ) : editor.queued ? (
              "Waiting to submit when the connection is back."
            ) : editor.saved && !editor.dirty ? (
              <>
                <CheckCircle2 aria-hidden className="size-4 text-success" />
                Submitted by {editor.saved.submittedBy}
                {editor.locked ? " and locked." : ". It can be locked from Review and lock."}
              </>
            ) : canEdit ? (
              "Everyone starts as present. Press P, A or L on a row to mark it and move down."
            ) : (
              "Changes aren't submitted until you select Submit register."
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={editor.reset} disabled={!editor.dirty}>
              Reset changes
            </Button>
            <Button size="sm" onClick={editor.submit} disabled={!canEdit || editor.submitting || editor.roster.length === 0 || (Boolean(editor.saved) && !editor.dirty && !editor.saved?.reopened)}>
              {editor.saved?.reopened ? "Save corrections" : "Submit register"}
            </Button>
          </div>
        </div>
      </div>

      {editor.saved && editor.saved.changes.length > 0 ? (
        <details className="rounded-xl border border-border bg-card px-5 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Change log ({editor.saved.changes.length})</summary>
          <ul className="mt-3 space-y-2">
            {[...editor.saved.changes].reverse().map((c, i) => {
              const name = editor.roster.find((s) => s.id === c.studentId)?.name ?? c.studentId;
              return (
                <li key={i} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{name}</span>: {statusLabel(c.from)} to {statusLabel(c.to)}, by {c.by},{" "}
                  {new Date(c.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  {c.reason ? `. Reason: ${c.reason}` : ""}
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {reopening && editor.id ? (
        <ReopenRegisterDialog
          registerId={editor.id}
          label={placeLabel}
          canUnlock={perms.canUnlock}
          onClose={() => setReopening(false)}
          onDone={setDialogNotice}
        />
      ) : null}
    </div>
  );
}
