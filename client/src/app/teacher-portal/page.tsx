"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PendingTasks, TodaySchedule } from "@/features/teacher-dashboard/components";
import { usePortalTeacher, useTeachingSections } from "@/features/teacher-portal/hooks";
import { useGetStudentsQuery, useGetTeacherDayQuery } from "@/store/api";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TeacherPortalPage() {
  // Rendered on the client at request time (see teacher-portal/loading.tsx).
  const { data } = useGetTeacherDayQuery();
  const { member } = usePortalTeacher();
  const sections = useTeachingSections();
  const { data: students = [] } = useGetStudentsQuery();
  if (!data) return null;
  const { todayClasses, teacherSummary } = data;
  const sectionIds = new Set(sections.map((t) => t.section.id));
  const studentCount = students.filter((s) => s.enrollment === "active" && sectionIds.has(s.sectionId)).length;
  const now = new Date();
  const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const done = todayClasses.filter((c) => c.status === "completed").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={`${greeting(now.getHours())}, ${member?.name ?? teacherSummary.name}`}
        description={`${today}. You have ${todayClasses.length} periods today.`}
      />

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <dt className="text-sm text-muted-foreground">Classes taught</dt>
          <dd className="mt-1 text-2xl font-semibold">
            {done} of {todayClasses.length}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <dt className="text-sm text-muted-foreground">Your students</dt>
          <dd className="mt-1 text-2xl font-semibold">{studentCount}</dd>
        </div>
      </dl>

      <PendingTasks />
      <TodaySchedule />
    </div>
  );
}
