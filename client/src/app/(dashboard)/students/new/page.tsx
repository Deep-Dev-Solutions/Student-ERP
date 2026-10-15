"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdmissionWizard } from "@/features/students/components/AdmissionWizard";

export default function NewAdmissionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New admission" description="Four short steps. You can save a draft at any point and finish later." />
      <AdmissionWizard />
    </div>
  );
}
