"use client";

import { useParams } from "next/navigation";
import { SchoolDetail } from "@/features/console/components/SchoolDetail";

export default function SchoolPage() {
  const { id } = useParams<{ id: string }>();
  return <SchoolDetail tenantId={decodeURIComponent(id)} />;
}
