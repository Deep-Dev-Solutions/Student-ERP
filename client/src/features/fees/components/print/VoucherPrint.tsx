"use client";

import { useSyncExternalStore } from "react";
import { FileText } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { useToday } from "@/features/attendance/hooks";
import { useCurrentBranch } from "@/hooks/use-session";
import { voucherBalance, voucherState } from "@/lib/fees";
import { useGetStudentsQuery, useGetVouchersQuery } from "@/store/api";
import { VoucherChallan } from "./VoucherChallan";

const noSubscribe = () => () => {};

/** One voucher, by id. */
export function SingleVoucherPrint({ voucherId }: { voucherId: string }) {
  const { data: vouchers = [] } = useGetVouchersQuery();
  const voucher = vouchers.find((v) => v.id === voucherId);
  if (!voucher) {
    return <EmptyState icon={FileText} title="We couldn't find this voucher" description="It may have been removed." action={<ButtonLink href="/fees?tab=vouchers">Back to vouchers</ButtonLink>} />;
  }
  return (
    <>
      <PrintToolbar backHref="/fees?tab=vouchers" backLabel="Back to vouchers" />
      <article className="mx-auto max-w-[210mm] p-6 sm:p-10 print:max-w-none print:p-0">
        <VoucherChallan voucher={voucher} />
      </article>
    </>
  );
}

/** Every voucher matching the list's filters (?month=, ?class=, ?status=), one per page. */
export function BulkVoucherPrint() {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const today = useToday();
  const branch = useCurrentBranch();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const month = params.get("month") ?? "all";
  const cls = params.get("class") ?? "all";
  const status = params.get("status") ?? "all";
  const name = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const list = vouchers
    .filter((v) => v.branchId === branch?.id && (month === "all" || v.month === month) && (cls === "all" || v.classId === cls))
    .filter((v) => (status === "outstanding" ? voucherBalance(v) > 0 : status === "all" || voucherState(v, today) === status))
    .sort((a, b) => a.classId.localeCompare(b.classId, undefined, { numeric: true }) || name(a.studentId).localeCompare(name(b.studentId)));

  return (
    <>
      <PrintToolbar backHref={`/fees?tab=vouchers`} backLabel={`Back to vouchers (${list.length} to print)`} />
      <article className="mx-auto max-w-[210mm] p-6 sm:p-10 print:max-w-none print:p-0">
        {search && list.length === 0 ? <EmptyState icon={FileText} title="No vouchers to print" description="Change the filters on the vouchers list." /> : null}
        {list.map((v) => (
          <VoucherChallan key={v.id} voucher={v} />
        ))}
      </article>
    </>
  );
}
