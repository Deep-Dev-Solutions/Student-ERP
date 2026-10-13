"use client";

import { CheckCircle2, Clock, MapPin, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGetTeacherDayQuery } from "@/store/api";

export function TodaySchedule() {
  const todayClasses = useGetTeacherDayQuery().data?.todayClasses ?? [];
  return (
    <section aria-labelledby="schedule-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="schedule-heading" className="text-base font-semibold">
          Today&apos;s classes
        </h2>
        <span className="text-sm text-muted-foreground">{todayClasses.length} periods</span>
      </div>

      <ol className="space-y-2">
        {todayClasses.map((item) => {
          const isCurrent = item.status === "current";
          const isUpcoming = item.status === "upcoming";
          return (
            <li key={item.id}>
              <Card
                aria-current={isCurrent ? "time" : undefined}
                className={cn("gap-0 px-4 py-4", isCurrent && "border-primary ring-1 ring-primary")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.period}</span>
                      <span className="flex items-center gap-1">
                        <Clock aria-hidden className="size-3.5" />
                        {item.time}
                      </span>
                      {isCurrent ? <Badge variant="info">Now</Badge> : null}
                      {item.status === "completed" ? <Badge variant="neutral">Done</Badge> : null}
                    </div>
                    <h3 className="text-base font-semibold">
                      {item.subject}, {item.className} {item.section.replace("Section ", "")}
                    </h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin aria-hidden className="size-3.5" />
                      {item.room}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {item.attendanceMarked ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-success">
                        <CheckCircle2 aria-hidden className="size-4" />
                        Attendance marked
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-sm text-muted-foreground">Starts later</span>
                    ) : (
                      <ButtonLink
                        href="/teacher-portal/attendance"
                        size="sm"
                        variant={isCurrent ? "default" : "outline"}
                      >
                        <UserCheck data-icon="inline-start" />
                        Mark attendance
                      </ButtonLink>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
