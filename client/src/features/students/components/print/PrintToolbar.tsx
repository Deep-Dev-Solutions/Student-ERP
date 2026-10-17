"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Back and Print, shown on screen and left off the paper. */
export function PrintToolbar({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 print:hidden sm:px-8">
      <ButtonLink href={backHref} variant="ghost" size="sm">
        <ArrowLeft data-icon="inline-start" />
        {backLabel}
      </ButtonLink>
      <Button size="sm" onClick={() => window.print()}>
        <Printer data-icon="inline-start" />
        Print
      </Button>
    </div>
  );
}
