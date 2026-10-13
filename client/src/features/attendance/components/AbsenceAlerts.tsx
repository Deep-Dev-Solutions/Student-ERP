"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BRAND } from "@/lib/brand";
import {
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Check,
  Clock,
  Phone,
} from "lucide-react";
import { useGetAbsenteesQuery, useGetCampusProfileQuery } from "@/store/api";
import { StudentAttendanceRecord } from "../types";
import { useReadOnly } from "@/hooks/use-academics";

interface AbsenceAlertsProps {
  absentStudents?: StudentAttendanceRecord[];
}

export function AbsenceAlerts({
  absentStudents: absentStudentsProp,
}: AbsenceAlertsProps) {
  const readOnly = useReadOnly();
  const { data: absentees = [] } = useGetAbsenteesQuery();
  const schoolName = useGetCampusProfileQuery().data?.schoolName;
  const absentStudents = absentStudentsProp ?? absentees;
  const [sentAt, setSentAt] = useState<string | null>(null);
  const count = absentStudents.length;

  const sendAlerts = () =>
    setSentAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));

  return (
    <div className="space-y-4">
      <Card className="gap-4 px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-tint text-danger">
              <AlertCircle aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">
                {count} {count === 1 ? "student" : "students"} absent today
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Each guardian gets a WhatsApp message on their registered number. If WhatsApp
                can&apos;t reach them, an SMS is sent instead.
              </p>
            </div>
          </div>

          <Button size="lg" onClick={sendAlerts} disabled={readOnly || sentAt !== null || count === 0}>
            <Send data-icon="inline-start" />
            {sentAt ? "Alerts sent" : `Send ${count} WhatsApp ${count === 1 ? "alert" : "alerts"}`}
          </Button>
        </div>

        {sentAt ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success"
          >
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            Sent {count} WhatsApp {count === 1 ? "alert" : "alerts"} at {sentAt}. Delivery receipts
            are recorded in the activity log.
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
                Respected parent, your child <span className="font-medium">[Student name]</span>{" "}
                (class 9-A) was marked absent on 9 Oct 2026 without prior written notice.
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
              <CardTitle>Absent today ({count})</CardTitle>
              <CardDescription className="mt-0.5">Guardians who will be messaged</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">Classes 9 and 10</span>
          </div>

          {count === 0 ? (
            <EmptyState icon={CheckCircle2} title="No absences today" description="Everyone marked so far is present or on approved leave." />
          ) : (
            <ul className="divide-y divide-border">
              {absentStudents.map((student) => (
                <li
                  key={student.id}
                  className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                    >
                      {student.avatar}
                    </span>
                    <div>
                      <p className="font-medium">
                        {student.name}{" "}
                        <span className="font-normal text-muted-foreground">{student.id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{student.remark || "No reason recorded"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Phone aria-hidden className="size-3.5 text-muted-foreground" />
                      {student.guardianPhone}
                    </span>
                    {sentAt ? (
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
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
