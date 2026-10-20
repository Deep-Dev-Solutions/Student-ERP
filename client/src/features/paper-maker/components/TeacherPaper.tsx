"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePortalTeacher } from "@/features/teacher-portal/hooks";
import { usePermissionFlags } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { useGetPaperCatalogQuery, useGetPapersQuery } from "@/store/api";
import { scopeNames } from "../helpers";
import { PaperHistory } from "./PaperHistory";
import { PaperPreview } from "./PaperPreview";
import { PaperStatusBadge } from "./PaperStatusBadge";
import { PaperWizardView } from "./PaperWizardView";

/** A teacher's paper: the wizard while it's a draft or returned, otherwise a read-only preview with its status. */
export function TeacherPaper({ paperId }: { paperId?: string }) {
  const { staffId, member } = usePortalTeacher();
  const { data: papers, isLoading } = useGetPapersQuery();
  const { data: catalog } = useGetPaperCatalogQuery();
  const { canPrintPapers } = usePermissionFlags();
  const [submitted] = useUrlParam("submitted", "");

  if (!staffId || !member) return null;
  if (!paperId) return <PaperWizardView teacherId={staffId} branchId={member.branchId} />;
  if (isLoading || !papers) return null;
  const paper = papers.find((p) => p.id === paperId && p.teacherId === staffId);
  if (!paper) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Card className="py-0">
          <EmptyState icon={FileText} title="We couldn't find this paper" description="It may belong to another teacher." action={<ButtonLink href="/teacher-portal/paper-maker">Back to my papers</ButtonLink>} />
        </Card>
      </div>
    );
  }
  if (paper.status === "draft" || paper.status === "returned") return <PaperWizardView key={paper.id} paper={paper} teacherId={staffId} branchId={member.branchId} />;

  const names = scopeNames(paper, catalog);
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={paper.details.examName}
        meta={<PaperStatusBadge status={paper.status} />}
        description={`${names.board}, ${names.className}, ${names.book}.`}
        actions={
          canPrintPapers ? (
            <ButtonLink href={`/papers/${paper.id}`} variant="outline">
              Open in print queue
            </ButtonLink>
          ) : null
        }
      />
      {submitted ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
          <CheckCircle2 aria-hidden className="size-4 shrink-0" />
          Submitted for printing. You&apos;ll see here when it&apos;s printed or if it comes back with a note.
        </p>
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
          <p className="text-sm text-muted-foreground">
            {paper.status === "submitted" ? "Waiting in the office's print queue. It can't be changed unless it's returned to you." : "Printed by the office."}
          </p>
          <PaperHistory paper={paper} />
        </Card>
      </div>
    </div>
  );
}
