"use client";

import { useParams } from "next/navigation";
import { PaperDesk } from "@/features/paper-maker/components/PaperDesk";

export default function PaperDeskPage() {
  const { id } = useParams<{ id: string }>();
  return <PaperDesk paperId={decodeURIComponent(id)} />;
}
