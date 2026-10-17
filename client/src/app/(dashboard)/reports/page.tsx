"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ReportsHub } from "@/features/reports/components/ReportsHub";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Fees, attendance, students, staff, exams and campuses, ready to export or print." />
      <ReportsHub />
    </div>
  );
}
