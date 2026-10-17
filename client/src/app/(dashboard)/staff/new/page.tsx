"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StaffForm } from "@/features/staff/components/StaffForm";

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add staff member" description="Personal details, employment and salary. A staff number is given when you save." />
      <StaffForm />
    </div>
  );
}
