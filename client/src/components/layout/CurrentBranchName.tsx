"use client";

import { useCurrentBranch } from "@/hooks/use-session";

/** The selected campus's name, as plain text. */
export function CurrentBranchName() {
  return <>{useCurrentBranch()?.name}</>;
}
