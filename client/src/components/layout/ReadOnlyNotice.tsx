"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentSession, useSelectedSession } from "@/hooks/use-academics";
import { useAppDispatch } from "@/store/hooks";
import { sessionSelected } from "@/store/sessionSlice";

/** Shown above every admin page while a past session is selected. */
export function ReadOnlyNotice() {
  const dispatch = useAppDispatch();
  const { session, readOnly } = useSelectedSession();
  const current = useCurrentSession();
  if (!readOnly || !session || !current) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2">
        <History aria-hidden className="size-4 shrink-0" />
        You&apos;re viewing {session.label}, a past session. Records are read-only.
      </p>
      <Button variant="outline" size="sm" onClick={() => dispatch(sessionSelected(current.id))}>
        Back to {current.label}
      </Button>
    </div>
  );
}
