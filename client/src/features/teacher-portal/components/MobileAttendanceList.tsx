"use client";

import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  UserX,
  Save,
  Lock,
  CalendarOff,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { sectionRoster } from "@/lib/results";
import { useGetStudentsQuery } from "@/store/api";
import { useRegisterPermissions } from "@/features/attendance/hooks";
import { useOutboxFlush, useRegisterEditor } from "@/features/attendance/useRegisterEditor";
import type { AttendanceStatus } from "@/types";

const statusOptions: {
  value: AttendanceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: string;
}[] = [
  { value: "present", label: "Present", icon: CheckCircle2, checked: "bg-success text-success-foreground" },
  { value: "absent", label: "Absent", icon: UserX, checked: "bg-danger text-danger-foreground" },
  { value: "leave", label: "Leave", icon: Clock, checked: "bg-warning text-warning-foreground" },
];

interface MobileAttendanceListProps {
  branchId: string;
  classId: string;
  sectionId: string;
  /** Set when the school takes attendance subject by subject. */
  subjectId?: string;
  /** Empty until the device's date is known. */
  date: string;
}

export function MobileAttendanceList({ branchId, classId, sectionId, subjectId, date }: MobileAttendanceListProps) {
  useOutboxFlush();
  const perms = useRegisterPermissions(sectionId, subjectId);
  const editor = useRegisterEditor(sectionId && date ? { branchId, classId, sectionId, date, ...(subjectId ? { subjectId } : {}) } : null);
  const canEdit = perms.canMark && !editor.locked && !editor.holiday && !editor.future;
  const { data: students = [] } = useGetStudentsQuery();
  const rollNo = new Map(sectionRoster(students, sectionId).map((r) => [r.student.id, r.rollNo]));

  const count = (status: AttendanceStatus) => editor.roster.filter((s) => editor.marks[s.id]?.status === status).length;
  const presentCount = count("present");
  const tally = [
    { label: "Present", count: presentCount, dot: "bg-success" },
    { label: "Absent", count: count("absent"), dot: "bg-danger" },
    { label: "Leave", count: count("leave"), dot: "bg-warning" },
  ];

  const blockedMessage = editor.holiday
    ? { icon: CalendarOff, text: `No register today: ${editor.holiday}.` }
    : editor.locked
      ? { icon: Lock, text: "This register is locked. Ask the branch admin to reopen it if something needs correcting." }
      : !perms.canMark
        ? { icon: Lock, text: perms.reason }
        : null;

  return (
    <div className="space-y-4 pb-24">
      {!editor.online ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          <WifiOff aria-hidden className="size-4 shrink-0" />
          You&apos;re offline. Marks are saved on this phone and sent when you&apos;re back online.
        </p>
      ) : null}
      {blockedMessage ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-info/30 bg-info-tint p-3 text-sm text-info">
          <blockedMessage.icon aria-hidden className="size-4 shrink-0" />
          {blockedMessage.text}
        </p>
      ) : null}
      {editor.draftIsNewer && canEdit ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-tint p-3 text-sm text-info">
          <span>This phone has unsent marks for this class.</span>
          <Button size="sm" onClick={editor.restoreDraft}>
            Restore
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border bg-card py-2 pr-2 pl-4">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Summary">
          {tally.map((t) => (
            <li key={t.label} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-2 rounded-full ${t.dot}`} />
              <span className="text-muted-foreground">{t.label}</span>
              <span className="font-semibold">{t.count}</span>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" onClick={() => editor.markAll("present")} disabled={!canEdit}>
          All present
        </Button>
      </div>

      {editor.roster.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={UserX} title="No students in this section" description="Pick another class or section." />
        </Card>
      ) : (
        <ul className="space-y-2">
          {editor.roster.map((student) => (
            <li key={student.id}>
              <Card className="gap-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                  >
                    {student.avatar}
                  </span>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Roll {rollNo.get(student.id) ?? student.id}</p>
                  </div>
                </div>

                <div
                  role="radiogroup"
                  aria-label={`Attendance for ${student.name}`}
                  className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1"
                >
                  {statusOptions.map(({ value, label, icon: Icon, checked: checkedClass }) => {
                    const checked = editor.marks[student.id]?.status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => editor.setStatus(student.id, value)}
                        disabled={!canEdit}
                        className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                          checked ? checkedClass : "text-muted-foreground hover:bg-card"
                        }`}
                      >
                        <Icon aria-hidden className="size-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Sits just above the mobile bottom nav; next to the sidebar on desktop. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 bg-gradient-to-t from-background via-background/95 to-transparent p-4 md:bottom-0 md:pl-66">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2 md:max-w-2xl">
          {editor.notice ? (
            <p
              role="status"
              className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm ${
                editor.notice.error ? "border-danger/30 bg-danger-tint text-danger" : "border-success/30 bg-success-tint text-success"
              }`}
            >
              {editor.notice.error ? <AlertCircle aria-hidden className="size-4" /> : <CheckCircle2 aria-hidden className="size-4" />}
              {editor.notice.error ?? editor.notice.ok}
            </p>
          ) : null}
          <Button
            size="lg"
            onClick={editor.submit}
            disabled={!canEdit || editor.submitting || editor.roster.length === 0 || (Boolean(editor.saved) && !editor.dirty && !editor.saved?.reopened)}
            className="h-12 w-full text-base"
          >
            {editor.submitting ? (
              <>
                <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                Submitting…
              </>
            ) : editor.saved && !editor.dirty ? (
              <>
                <CheckCircle2 data-icon="inline-start" />
                Submitted ({presentCount} of {editor.roster.length} present)
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Submit attendance ({presentCount} of {editor.roster.length} present)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
