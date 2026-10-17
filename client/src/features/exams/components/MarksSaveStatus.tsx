"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { MarksSaveState } from "../useMarksEditor";

/** "Saving… / All changes saved at … / n marks need fixing" for an autosaving marks list. */
export function MarksSaveStatus({ state, errorCount, idle }: { state: MarksSaveState; errorCount: number; idle?: React.ReactNode }) {
  if (state.error)
    return (
      <span className="flex items-center gap-2 text-danger">
        <AlertCircle aria-hidden className="size-4 shrink-0" />
        {state.error}
      </span>
    );
  if (errorCount)
    return (
      <span className="flex items-center gap-2 text-danger">
        <AlertCircle aria-hidden className="size-4 shrink-0" />
        {errorCount === 1 ? "1 mark needs fixing; it isn't saved." : `${errorCount} marks need fixing; they aren't saved.`}
      </span>
    );
  if (state.saving)
    return (
      <span className="flex items-center gap-2">
        <Clock aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
        Saving…
      </span>
    );
  if (state.at)
    return (
      <span className="flex items-center gap-2 text-success">
        <CheckCircle2 aria-hidden className="size-4 shrink-0" />
        All changes saved at {state.at}.
      </span>
    );
  return <>{idle ?? null}</>;
}
