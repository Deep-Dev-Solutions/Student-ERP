"use client";

import { useParams } from "next/navigation";
import { AdmissionFormPrint } from "@/features/students/components/print/AdmissionFormPrint";

export default function AdmissionFormPrintPage() {
  const { id } = useParams<{ id: string }>();
  return <AdmissionFormPrint studentId={decodeURIComponent(id)} />;
}
