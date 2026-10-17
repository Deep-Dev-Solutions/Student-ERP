"use client";

import { useState } from "react";
import { CheckCircle2, CalendarOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch, useCurrentUser } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { errorMessage, useGetSchoolRulesQuery, useGetStaffAttendanceQuery, useGetStaffQuery, useSaveStaffAttendanceMutation } from "@/store/api";
import type { StaffAttendanceStatus } from "@/types";
import { holidayOn } from "../hooks";
import { useRegisterSelection } from "../useRegisterSelection";

const options: { value: StaffAttendanceStatus; label: string; short: string; checked: string; hover: string }[] = [
  { value: "present", label: "Present", short: "P", checked: "bg-success text-success-foreground", hover: "hover:bg-success-tint hover:text-success" },
  { value: "late", label: "Late", short: "Late", checked: "bg-warning text-warning-foreground", hover: "hover:bg-warning-tint hover:text-warning" },
  { value: "absent", label: "Absent", short: "A", checked: "bg-danger text-danger-foreground", hover: "hover:bg-danger-tint hover:text-danger" },
  { value: "leave", label: "Leave", short: "L", checked: "bg-info text-primary-foreground", hover: "hover:bg-info-tint hover:text-info" },
];

/** Daily attendance for teaching and office staff at this campus. */
export function StaffAttendance() {
  const readOnly = useReadOnly();
  const branch = useCurrentBranch();
  const user = useCurrentUser();
  const canMarkDaily = useCan("att_mark_daily");
  const selection = useRegisterSelection();
  const { date, today } = selection;
  const { data: staff = [] } = useGetStaffQuery();
  const { data: days = [] } = useGetStaffAttendanceQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const [save, { isLoading }] = useSaveStaffAttendanceMutation();
  const [edits, setEdits] = useState<{ date: string; marks: Record<string, StaffAttendanceStatus> } | null>(null);
  const [notice, setNotice] = useState<{ ok?: string; error?: string } | null>(null);

  const roster = staff.filter((m) => m.status !== "terminated");
  const saved = days.find((d) => d.branchId === branch?.id && d.date === date);
  const marks: Record<string, StaffAttendanceStatus> =
    edits?.date === date
      ? edits.marks
      : Object.fromEntries(roster.map((m) => [m.staffId, saved?.marks[m.staffId] ?? (m.status === "on_leave" ? "leave" : "present")]));
  const holiday = holidayOn(date, rules);
  const canEdit = !readOnly && !holiday && Boolean(date) && (canMarkDaily || user?.role === "owner" || user?.role === "branch_admin") && (!today || date <= today);
  const count = (s: StaffAttendanceStatus) => roster.filter((m) => marks[m.staffId] === s).length;

  const setStatus = (staffId: string, status: StaffAttendanceStatus) => {
    setEdits({ date, marks: { ...marks, [staffId]: status } });
    setNotice(null);
  };

  const submit = async () => {
    if (!branch) return;
    const result = await save({ branchId: branch.id, date, marks });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setEdits(null);
    setNotice({ ok: `Staff attendance saved for ${formatDate(date)}.` });
  };

  return (
    <div className="space-y-4">
      <div className="w-44">
        <label htmlFor="staff-date" className="mb-1.5 block text-sm font-medium">
          Date
        </label>
        <Input id="staff-date" type="date" value={date} max={today ?? undefined} onChange={(e) => selection.setDate(e.target.value)} className="h-9 bg-card" />
      </div>

      {holiday ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-info/30 bg-info-tint p-3 text-sm text-info">
          <CalendarOff aria-hidden className="size-4 shrink-0" />
          No attendance on {formatDate(date)}: {holiday}.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={count("present")} footer={`of ${roster.length} staff`} />
        <StatCard label="Late" value={count("late")} footer="Arrived after the bell" />
        <StatCard label="Absent" value={count("absent")} footer="Without leave" />
        <StatCard label="On leave" value={count("leave")} footer="Approved leave" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Staff member</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead className="pr-5 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map((m) => (
              <TableRow key={m.staffId}>
                <TableCell className="pl-5 whitespace-normal">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground sm:flex">
                      {m.avatar}
                    </span>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{m.department}</TableCell>
                <TableCell className="pr-5 text-right">
                  <div role="radiogroup" aria-label={`Attendance for ${m.name}`} className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
                    {options.map((o) => {
                      const checked = marks[m.staffId] === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          aria-label={o.label}
                          title={o.label}
                          disabled={!canEdit}
                          onClick={() => setStatus(m.staffId, o.value)}
                          className={`flex h-8 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                            checked ? o.checked : `text-muted-foreground ${o.hover}`
                          }`}
                        >
                          {o.short}
                        </button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            {notice?.error ? (
              <>
                <AlertCircle aria-hidden className="size-4 text-danger" />
                <span className="text-danger">{notice.error}</span>
              </>
            ) : notice?.ok ? (
              <>
                <CheckCircle2 aria-hidden className="size-4 text-success" />
                {notice.ok}
              </>
            ) : saved && edits?.date !== date ? (
              `Saved by ${saved.savedBy}.`
            ) : (
              "Everyone starts as present. Mark late arrivals and absences, then save."
            )}
          </p>
          <Button size="sm" onClick={submit} disabled={!canEdit || isLoading || (Boolean(saved) && edits?.date !== date)}>
            Save staff attendance
          </Button>
        </div>
      </div>
    </div>
  );
}
