import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { feeTarget, formatRupees } from "@/features/dashboard/data";

export function FeeTargetCard() {
  const { month, collected, target, overdueAmount, overdueVouchers } = feeTarget;
  const percent = Math.round((collected / target) * 100);

  return (
    <Card className="gap-4 px-5">
      <div>
        <h2 className="text-base font-semibold">Fee collection</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{month}, month to date</p>
      </div>

      <div>
        <p className="text-3xl font-semibold tracking-tight">{formatRupees(collected)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          of {formatRupees(target)} target · {percent}%
        </p>
        <div
          role="meter"
          aria-label="Fee target progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Link
        href="/fees"
        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="text-sm">
          <span className="font-medium">{formatRupees(overdueAmount)}</span>
          <span className="text-muted-foreground"> overdue on {overdueVouchers} vouchers</span>
        </span>
        <Badge variant="danger">Follow up</Badge>
      </Link>
    </Card>
  );
}
