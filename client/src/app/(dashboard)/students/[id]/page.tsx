"use client";

import { useParams } from "next/navigation";
import { StudentProfile } from "@/features/students/components/StudentProfile";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <StudentProfile studentId={decodeURIComponent(id)} />;
}
