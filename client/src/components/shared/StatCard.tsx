import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Supporting line under the value: a delta, progress, or context. */
  footer?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/**
 * A single figure with its label. Colour belongs in the footer (a Badge or
 * delta), not on the headline number, so alarm colours keep their meaning.
 */
export function StatCard({ label, value, footer, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("gap-3 px-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon aria-hidden className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
      {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
    </Card>
  );
}
