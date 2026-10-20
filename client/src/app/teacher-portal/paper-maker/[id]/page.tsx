"use client";

import { useParams } from "next/navigation";
import { TeacherPaper } from "@/features/paper-maker/components/TeacherPaper";

export default function TeacherPaperPage() {
  const { id } = useParams<{ id: string }>();
  return <TeacherPaper paperId={decodeURIComponent(id)} />;
}
