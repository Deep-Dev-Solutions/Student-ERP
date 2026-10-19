"use client";

import { FileDown, Printer, UploadCloud, UserPlus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StudentDirectory } from "@/features/students/components";
import { studentsCsv, useStudentDirectory } from "@/features/students/useStudentDirectory";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { downloadFile } from "@/lib/csv";
import { localISODate } from "@/lib/dates";

export default function StudentsPage() {
  const canAdmit = useCan("adm_admit_student");
  const readOnly = useReadOnly();
  const branch = useCurrentBranch();
  const { view, placement } = useStudentDirectory();

  // Exports every student matching the current filters, not just this page.
  const exportCsv = () =>
    downloadFile(`students-${branch?.code ?? "campus"}-${localISODate()}.csv`, studentsCsv(view.sorted, placement));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Look up records, admit students and import admissions in bulk."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={view.total === 0}>
              <FileDown data-icon="inline-start" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/print/students${window.location.search}`, "_blank", "noopener")}
              disabled={view.total === 0}
            >
              <Printer data-icon="inline-start" />
              Print list
            </Button>
            {canAdmit && !readOnly ? (
              <>
                <ButtonLink href="/students/import" variant="outline">
                  <UploadCloud data-icon="inline-start" />
                  Import
                </ButtonLink>
                <ButtonLink href="/students/new">
                  <UserPlus data-icon="inline-start" />
                  New admission
                </ButtonLink>
              </>
            ) : null}
          </>
        }
      />

      <StudentDirectory />
    </div>
  );
}
