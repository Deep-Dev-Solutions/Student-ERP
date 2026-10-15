"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { BulkImport } from "@/features/students/components";

// The step-by-step import (mapping, row checks, error file) replaces this in task C6.
export default function ImportStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Import students" description="Add admissions from a spreadsheet based on the template." />
      <BulkImport />
    </div>
  );
}
