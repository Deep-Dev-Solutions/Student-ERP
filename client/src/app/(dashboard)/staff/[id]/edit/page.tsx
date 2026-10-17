"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StaffForm } from "@/features/staff/components/StaffForm";
import { useGetStaffQuery } from "@/store/api";

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const staffId = decodeURIComponent(id);
  const member = useGetStaffQuery().data?.find((m) => m.id === staffId);
  return (
    <div className="space-y-6">
      <PageHeader title={member ? `Edit ${member.name}` : "Edit staff member"} description="Personal details, employment and salary." />
      <StaffForm staffId={staffId} />
    </div>
  );
}
