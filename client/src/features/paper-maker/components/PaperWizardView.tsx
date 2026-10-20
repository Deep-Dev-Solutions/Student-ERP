"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCanAccess } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { paperProblem } from "@/services/paper/contract";
import { useGetCampusProfileQuery } from "@/store/api";
import type { Paper } from "@/types";
import { STEPS, usePaperWizard, type PaperWizard } from "../usePaperWizard";
import { PaperPreview } from "./PaperPreview";
import { QuestionsStep } from "./QuestionsStep";
import { BoardStep, BookStep, ChaptersStep, ClassStep } from "./ScopeSteps";

function DetailsStep({ wizard }: { wizard: PaperWizard }) {
  const { details } = wizard.draft;
  const profile = useGetCampusProfileQuery().data;
  const canOpenSettings = useCanAccess("/settings");
  const initials = profile?.schoolName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  return (
    <div className="space-y-6">
      <Card className="gap-6 px-5 sm:px-6">
        <div>
          <CardTitle>
            <h2>Paper details</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">These print at the top of the paper.</CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField id="paper-exam" label="Exam name" placeholder="e.g. Monthly test, Kinematics" wrapperClassName="sm:col-span-3" value={details.examName} onChange={(e) => wizard.setDetails({ examName: e.target.value })} />
          <TextField id="paper-date" label="Exam date" type="date" value={details.date} onChange={(e) => wizard.setDetails({ date: e.target.value })} />
          <TextField id="paper-time" label="Time allowed" placeholder="e.g. 60 minutes" value={details.timeAllowed} onChange={(e) => wizard.setDetails({ timeAllowed: e.target.value })} />
          <div>
            <p className="mb-1.5 block text-sm font-medium">Total marks</p>
            <Input aria-label="Total marks" readOnly value={String(wizard.draft.questions.reduce((n, q) => n + q.marks, 0))} className="h-9 bg-muted tabular-nums" />
          </div>
        </div>
        <div>
          <label htmlFor="paper-instructions" className="mb-1.5 block text-sm font-medium">
            Instructions for students
          </label>
          <textarea
            id="paper-instructions"
            rows={3}
            value={details.instructions}
            onChange={(e) => wizard.setDetails({ instructions: e.target.value })}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          {profile?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoUrl} alt="" className="size-10 rounded-lg object-contain" />
          ) : (
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
              {initials}
            </span>
          )}
          <p>
            <span className="block font-medium">{profile?.schoolName}</span>
            <span className="text-muted-foreground">
              School name and logo come from{" "}
              {canOpenSettings ? (
                <Link href="/settings?tab=profile" className="rounded text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                  Settings, Institute
                </Link>
              ) : (
                "the institute settings"
              )}
              .
            </span>
          </p>
        </div>
      </Card>
      <Card className="gap-4 px-5 sm:px-6">
        <div>
          <CardTitle>
            <h2>Preview</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">How the paper will look. Printing is done by the office after you submit.</CardDescription>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <PaperPreview paper={wizard.draft} />
        </div>
      </Card>
    </div>
  );
}

/** The six-step paper maker for a new paper, a draft, or a paper returned to the teacher. */
export function PaperWizardView({ paper, teacherId, branchId }: { paper?: Paper; teacherId: string; branchId: string }) {
  const router = useRouter();
  const wizard = usePaperWizard({ paper, teacherId, branchId });
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const { step, reachable, draft } = wizard;
  const canNext = step < STEPS.length && reachable > step;
  const problem = paperProblem(draft);

  const save = async () => {
    const saved = await wizard.save();
    if (saved && !draft.id) router.replace(`/teacher-portal/paper-maker/${saved.id}`);
  };
  const submit = async () => {
    const done = await wizard.submit();
    setConfirmSubmit(false);
    if (done) router.push(`/teacher-portal/paper-maker/${done.id}?submitted=1`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title={paper ? draft.details.examName || "Untitled paper" : "Make an exam paper"} description="Pick the board, book and chapters, set the questions, then submit the paper for printing." />

      {paper?.status === "returned" && paper.returnNote ? (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">Returned for changes: </span>
            {paper.returnNote}
          </span>
        </p>
      ) : null}

      <Card className="py-4">
        <ol className="grid grid-cols-3 gap-x-2 gap-y-3 px-4 sm:grid-cols-6 sm:px-5" aria-label="Steps">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            const open = n <= reachable;
            return (
              <li key={s.title} aria-current={state === "current" ? "step" : undefined}>
                <button type="button" disabled={!open} onClick={() => wizard.goTo(n)} className="flex w-full items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold", state === "todo" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>
                    {state === "done" ? <Check aria-hidden className="size-4" /> : n}
                    {state === "done" ? <span className="sr-only">Step {n}, done</span> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-sm font-medium", state === "todo" && "text-muted-foreground")}>{s.title}</span>
                    <span className="hidden truncate text-xs text-muted-foreground lg:block">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <div>
        {step === 1 && <BoardStep wizard={wizard} />}
        {step === 2 && <ClassStep wizard={wizard} />}
        {step === 3 && <BookStep wizard={wizard} />}
        {step === 4 && <ChaptersStep wizard={wizard} />}
        {step === 5 && <QuestionsStep wizard={wizard} />}
        {step === 6 && <DetailsStep wizard={wizard} />}
      </div>

      {step !== 5 && (wizard.notice.success || wizard.notice.error) ? <FormStatus success={wizard.notice.success} error={wizard.notice.error} /> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={() => wizard.goTo(step - 1)} disabled={step === 1}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {wizard.dirty ? "Unsaved changes" : draft.id ? "All changes saved" : ""}
          </span>
          <Button variant="outline" onClick={save} disabled={wizard.saving || (!wizard.dirty && Boolean(draft.id))}>
            <Save data-icon="inline-start" />
            Save draft
          </Button>
          {step < STEPS.length ? (
            <Button onClick={() => wizard.goTo(step + 1)} disabled={!canNext}>
              Next: {STEPS[step].title.toLowerCase()}
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button onClick={() => setConfirmSubmit(true)} disabled={Boolean(problem) || wizard.submitting}>
              <Send data-icon="inline-start" />
              Submit for printing
            </Button>
          )}
        </div>
      </div>
      {step === STEPS.length && problem ? <p className="text-right text-sm text-muted-foreground">To submit: {problem.charAt(0).toLowerCase() + problem.slice(1)}.</p> : null}

      {wizard.pending ? (
        <Dialog open onOpenChange={(open) => !open && wizard.setPending(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{wizard.pending.title}</DialogTitle>
              <DialogDescription>{wizard.pending.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Keep my work</DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  wizard.pending?.apply();
                  wizard.setPending(null);
                }}
              >
                {wizard.pending.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {confirmSubmit ? (
        <Dialog open onOpenChange={(open) => !open && setConfirmSubmit(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit this paper for printing?</DialogTitle>
              <DialogDescription>
                It goes to the print queue and you can&apos;t change it afterwards, unless it&apos;s returned to you. {draft.questions.length} questions, {draft.questions.reduce((n, q) => n + q.marks, 0)} marks.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Not yet</DialogClose>
              <Button onClick={submit} disabled={wizard.submitting}>
                <Send data-icon="inline-start" />
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
