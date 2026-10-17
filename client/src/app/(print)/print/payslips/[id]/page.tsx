"use client";

import { useParams } from "next/navigation";
import { PayslipPrint } from "@/features/staff/components/print/PayslipPrint";

export default function PayslipPrintPage() {
  const { id } = useParams<{ id: string }>();
  return <PayslipPrint payslipId={decodeURIComponent(id)} />;
}
