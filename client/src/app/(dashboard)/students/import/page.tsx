"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ImportWizard } from "@/features/students/components/ImportWizard";

export default function ImportStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Import students" description="Add admissions from a spreadsheet. Every row is checked before anything is saved." />
      <ImportWizard />
    </div>
  );
}
