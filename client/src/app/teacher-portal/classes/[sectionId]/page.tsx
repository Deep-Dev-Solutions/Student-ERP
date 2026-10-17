"use client";

import { useParams } from "next/navigation";
import { ClassList } from "@/features/teacher-portal/components/ClassList";

export default function TeacherClassListPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  return <ClassList sectionId={decodeURIComponent(sectionId)} />;
}
