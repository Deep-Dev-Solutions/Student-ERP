"use client";

import { useState } from "react";
import { CheckCircle2, FileDown, FileKey, FileText, Printer, Undo2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePermissionFlags } from "@/hooks/use-session";
import { errorMessage, useGetPaperCatalogQuery, useGetPapersQuery, useMarkPaperPrintedMutation, useReturnPaperMutation } from "@/store/api";
import { paperDate, scopeNames, totalMarks } from "../helpers";
import { PaperHistory } from "./PaperHistory";
import { PaperPreview } from "./PaperPreview";
import { PaperStatusBadge } from "./PaperStatusBadge";
import { NoPrintAccess } from "./PrintQueue";

/** One submitted paper for the print desk: preview, print, answer key, mark printed or return. */
export function PaperDesk({ paperId }: { paperId: string }) {
  const { canPrintPapers } = usePermissionFlags();
  const { data: papers } = useGetPapersQuery();
  const { data: catalog } = useGetPaperCatalogQuery();
  const [markPrinted, { isLoading: marking }] = useMarkPaperPrintedMutation();
  const [returnPaper, { isLoading: returning }] = useReturnPaperMutation();
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const [returnOpen, setReturnOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  if (!canPrintPapers) return <NoPrintAccess />;
  if (!papers) return null;
  const paper = papers.find((p) => p.id === paperId && p.status !== "draft");
  if (!paper) return <EmptyState icon={FileText} title="We couldn't find this paper" description="It may still be a draft." action={<ButtonLink href="/papers">Back to the print queue</ButtonLink>} />;
  const names = scopeNames(paper, catalog);
  const printable = paper.status === "submitted" || paper.status === "printed";
  const open = (query: string) => window.open(`/print/papers/${paper.id}${query}`, "_blank", "noopener");

  const doReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await returnPaper({ id: paper.id, note });
    if ("error" in result) return setNoteError(errorMessage(result.error));
    setReturnOpen(false);
    setNote("");
    setNotice({ success: `Returned to ${paper.teacherName} with your note.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={paper.details.examName}
        meta={<PaperStatusBadge status={paper.status} />}
        description={`${paper.teacherName}. ${names.board}, ${names.className}, ${names.book}. Exam on ${paperDate(paper.details.date)}, ${paper.details.timeAllowed}, ${totalMarks(paper)} marks.`}
        actions={
          printable ? (
            <>
              <Button variant="outline" onClick={() => open("")}>
                <Printer data-icon="inline-start" />
                Print
              </Button>
              <Button variant="outline" onClick={() => open("?pdf=1")}>
                <FileDown data-icon="inline-start" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => open("?key=1")}>
                <FileKey data-icon="inline-start" />
                Print answer key
              </Button>
            </>
          ) : null
        }
      />
      {notice.success || notice.error ? (
        <div className={notice.error ? "" : "rounded-lg border border-success/30 bg-success-tint p-3"}>
          <FormStatus success={notice.success} error={notice.error} />
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="gap-4 px-5 sm:px-6 lg:col-span-2">
          <CardTitle>
            <h2>Preview</h2>
          </CardTitle>
          <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
            <PaperPreview paper={paper} />
          </div>
        </Card>
        <Card className="h-fit gap-4 px-5 sm:px-6">
          <CardTitle>
            <h2>Status</h2>
          </CardTitle>
          {paper.status === "submitted" ? (
            <div className="flex flex-col gap-2">
              <Button
                disabled={marking}
                onClick={async () => {
                  const result = await markPrinted(paper.id);
                  setNotice("error" in result ? { error: errorMessage(result.error) } : { success: "Marked as printed. The teacher can see it." });
                }}
              >
                <CheckCircle2 data-icon="inline-start" />
                Mark printed
              </Button>
              <Button variant="outline" onClick={() => setReturnOpen(true)}>
                <Undo2 data-icon="inline-start" />
                Return to teacher
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{paper.status === "printed" ? "Printed. It can still be reprinted." : "Returned to the teacher for changes."}</p>
          )}
          <PaperHistory paper={paper} />
        </Card>
      </div>

      {returnOpen ? (
        <Dialog open onOpenChange={(o) => !o && setReturnOpen(false)}>
          <DialogContent>
            <form onSubmit={doReturn} noValidate className="flex flex-col gap-5">
              <DialogHeader>
                <DialogTitle>Return to {paper.teacherName}</DialogTitle>
                <DialogDescription>Say what needs changing. The teacher sees this note and can edit and resubmit the paper.</DialogDescription>
              </DialogHeader>
              <div>
                <label htmlFor="return-note" className="mb-1.5 block text-sm font-medium">
                  Note for the teacher
                </label>
                <textarea
                  id="return-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Question 7 is repeated from last month's test; please replace it."
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
              {noteError ? <FormStatus error={noteError} /> : null}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                <Button type="submit" disabled={returning}>
                  <Undo2 data-icon="inline-start" />
                  Return paper
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
