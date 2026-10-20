"use client";

import { useSyncExternalStore } from "react";
import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { usePermissionFlags } from "@/hooks/use-session";
import { useGetPrintablePaperQuery } from "@/store/api";
import { NoPrintAccess } from "./PrintQueue";
import { PaperPreview } from "./PaperPreview";

const noSubscribe = () => () => {};

/** The printable paper (?key=1 for the answer key). The paper service refuses callers without the print permission. */
export function PaperPrint({ paperId }: { paperId: string }) {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const answerKey = params.get("key") === "1";
  const { canPrintPapers } = usePermissionFlags();
  const { data: paper, error, isLoading } = useGetPrintablePaperQuery({ id: paperId, answerKey }, { skip: !canPrintPapers });

  if (!canPrintPapers || (error && "status" in error && error.status === 403)) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <NoPrintAccess />
      </div>
    );
  }
  if (isLoading || !paper) return error ? <p className="p-6 text-sm text-danger">This paper can&apos;t be printed.</p> : null;

  return (
    <>
      <PrintToolbar backHref={`/papers/${paper.id}`} backLabel="Back to the paper" />
      {params.get("pdf") === "1" ? (
        <p className="mx-auto max-w-[210mm] px-6 pt-4 text-sm text-muted-foreground print:hidden sm:px-10">To download a PDF, click Print and choose &ldquo;Save as PDF&rdquo; as the printer.</p>
      ) : null}
      <div className="mx-auto max-w-[210mm] p-6 sm:p-10 print:max-w-none print:p-0">
        <PaperPreview paper={paper} answerKey={answerKey} />
      </div>
    </>
  );
}
