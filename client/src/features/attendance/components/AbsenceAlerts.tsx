"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { BRAND } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import {
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Check,
  Clock,
  Phone,
  BellOff,
} from "lucide-react";
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import {
  useGetCampusProfileQuery,
  useGetRegistersQuery,
  useGetSchoolRulesQuery,
  useGetSectionsQuery,
  useGetStudentsQuery,
  useMarkAlertsSentMutation,
} from "@/store/api";
import { primaryGuardian } from "@/features/students/status";
import { useRegisterSelection } from "../useRegisterSelection";

export function AbsenceAlerts() {
  const readOnly = useReadOnly();
  const branch = useCurrentBranch();
  const selection = useRegisterSelection();
  const { date, today } = selection;
  const classes = useBranchClasses();
  const schoolName = useGetCampusProfileQuery().data?.schoolName;
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const [markSent, { isLoading: sending }] = useMarkAlertsSentMutation();
  const [sentNow, setSentNow] = useState<string | null>(null);

  // Absent students on every register submitted for this date at this campus.
  const dayRegisters = registers.filter((r) => r.branchId === branch?.id && r.date === date);
  const absences = dayRegisters.flatMap((r) =>
    Object.entries(r.marks)
      .filter(([, m]) => m.status === "absent")
      .map(([studentId, m]) => {
        const student = students.find((s) => s.id === studentId);
        const section = sections.find((s) => s.id === r.sectionId);
        const cls = classes.find((c) => c.id === r.classId);
        return {
          student,
          studentId,
          remark: m.remark,
          registerId: r.id,
          sent: Boolean(r.alertsSentAt),
          place: `${cls?.name.replace("Class ", "class ") ?? ""}-${section?.name ?? ""}`,
        };
      })
  );
  const count = absences.length;
  const unsent = absences.filter((a) => !a.sent);
  const alertsOn = rules?.notifications.absenceWhatsApp ?? true;
  const example = absences[0];

  const sendAlerts = async () => {
    const ids = [...new Set(unsent.map((a) => a.registerId))];
    const result = await markSent(ids);
    if (!("error" in result)) setSentNow(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  };

  return (
    <div className="space-y-4">
      <div className="w-44">
        <label htmlFor="alerts-date" className="mb-1.5 block text-sm font-medium">
          Date
        </label>
        <Input id="alerts-date" type="date" value={date} max={today ?? undefined} onChange={(e) => selection.setDate(e.target.value)} className="h-9 bg-card" />
      </div>

      <Card className="gap-4 px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-tint text-danger">
              <AlertCircle aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">
                {count} {count === 1 ? "student" : "students"} absent {date === today ? "today" : date ? `on ${formatDate(date)}` : ""}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                From the registers submitted so far. Each guardian gets a WhatsApp message on their registered number.
                {rules?.notifications.smsFallback ? " If WhatsApp can't reach them, an SMS is sent instead." : ""}
              </p>
            </div>
          </div>

          <Button size="lg" onClick={sendAlerts} disabled={readOnly || !alertsOn || sending || unsent.length === 0}>
            <Send data-icon="inline-start" />
            {unsent.length === 0 && count > 0
              ? "Alerts sent"
              : `Send ${unsent.length} WhatsApp ${unsent.length === 1 ? "alert" : "alerts"}`}
          </Button>
        </div>

        {!alertsOn ? (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-info/30 bg-info-tint p-3 text-sm text-info">
            <BellOff aria-hidden className="size-4 shrink-0" />
            Absence alerts are turned off in Settings, School rules.
          </p>
        ) : sentNow ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success"
          >
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            Sent WhatsApp alerts at {sentNow}. Delivery receipts are recorded in the activity log.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-4 px-5">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare aria-hidden className="size-4 text-muted-foreground" />
              Message preview
            </CardTitle>
            <CardDescription className="mt-0.5">What guardians receive on WhatsApp</CardDescription>
          </div>

          <figure className="rounded-lg border border-border bg-muted/60 p-4 text-sm">
            <p className="mb-2 font-semibold">{BRAND.name} · Attendance notice</p>
            <blockquote className="space-y-2">
              <p>
                Respected parent, your child <span className="font-medium">{example?.student?.name ?? "[Student name]"}</span>{" "}
                ({example?.place ?? "class"}) was marked absent on {date ? formatDate(date) : "[date]"} without prior written notice.
              </p>
              <p className="text-muted-foreground">
                If this is a mistake, please contact the campus office.
              </p>
            </blockquote>
            <figcaption className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span>From {schoolName}</span>
              <span className="flex items-center gap-1">
                <Check aria-hidden className="size-3" /> Verified sender
              </span>
            </figcaption>
          </figure>
        </Card>

        <Card className="gap-2 px-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Absent ({count})</CardTitle>
              <CardDescription className="mt-0.5">Guardians who will be messaged</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">
              {dayRegisters.length} {dayRegisters.length === 1 ? "register" : "registers"} submitted
            </span>
          </div>

          {count === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={dayRegisters.length ? "No absences" : "No registers submitted yet"}
              description={dayRegisters.length ? "Everyone marked so far is present or on approved leave." : "Absences appear here as class registers are submitted."}
            />
          ) : (
            <ul className="divide-y divide-border">
              {absences.map((a) => {
                const guardian = a.student ? primaryGuardian(a.student) : undefined;
                return (
                  <li key={`${a.registerId}-${a.studentId}`} className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                      >
                        {a.student?.avatar}
                      </span>
                      <div>
                        <p className="font-medium">
                          {a.student?.name ?? a.studentId}{" "}
                          <span className="font-normal text-muted-foreground">
                            {a.studentId}, {a.place}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{a.remark || "No reason recorded"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Phone aria-hidden className="size-3.5 text-muted-foreground" />
                        {guardian?.phone ?? "No number"}
                      </span>
                      {a.sent ? (
                        <Badge variant="success">
                          <Check aria-hidden /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          <Clock aria-hidden /> Not sent
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
