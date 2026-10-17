"use client";

import { useParams } from "next/navigation";
import { SingleVoucherPrint } from "@/features/fees/components/print/VoucherPrint";

export default function VoucherPrintPage() {
  const { id } = useParams<{ id: string }>();
  return <SingleVoucherPrint voucherId={decodeURIComponent(id)} />;
}
