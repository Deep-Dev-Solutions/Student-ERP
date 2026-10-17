"use client";

import { useParams } from "next/navigation";
import { StaffProfile } from "@/features/staff/components/StaffProfile";

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <StaffProfile staffId={decodeURIComponent(id)} />;
}
