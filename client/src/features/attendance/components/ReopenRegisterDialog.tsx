"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatus } from "@/components/shared/FormFields";
import { errorMessage, useRequestUnlockMutation, useUnlockRegisterMutation } from "@/store/api";

interface ReopenRegisterDialogProps {
  registerId: string;
  /** e.g. "Class 9, section A on 13 Oct 2026" */
  label: string;
  /** Branch admins reopen straight away; everyone else sends a request. */
  canUnlock: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Reopen a locked register (or ask a branch admin to), with a reason that goes in the change log. */
export function ReopenRegisterDialog({ registerId, label, canUnlock, onClose, onDone }: ReopenRegisterDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlock, unlockState] = useUnlockRegisterMutation();
  const [request, requestState] = useRequestUnlockMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = canUnlock ? await unlock({ id: registerId, reason }) : await request({ registerId, reason });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(
      canUnlock
        ? "Register reopened. Correct the marks and submit; it locks again and every change is logged."
        : "Request sent. A branch admin will reopen the register or reply."
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{canUnlock ? "Reopen register" : "Ask to reopen register"}</DialogTitle>
            <DialogDescription>
              {label}. {canUnlock ? "The reason is saved with every change you make." : "A branch admin sees your reason and decides."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="reopen-reason" className="mb-1.5 block text-sm font-medium">
              What needs changing, and why
            </label>
            <textarea
              id="reopen-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ahmed Khan arrived at 9:10 with a note from his father; he was marked absent."
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={unlockState.isLoading || requestState.isLoading}>
              {canUnlock ? "Reopen" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
