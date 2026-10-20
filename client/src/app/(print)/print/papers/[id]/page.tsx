"use client";

import { useParams } from "next/navigation";
import { PaperPrint } from "@/features/paper-maker/components/PaperPrint";

export default function PaperPrintPage() {
  const { id } = useParams<{ id: string }>();
  return <PaperPrint paperId={decodeURIComponent(id)} />;
}
