"use client";

import { useCan } from "@/hooks/use-session";
import { useUrlTab } from "@/hooks/use-url-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Users,
  UserPlus,
  UploadCloud,
  FileDown,
} from "lucide-react";
import {
  StudentDirectory,
  AdmissionForm,
  BulkImport,
} from "@/features/students/components";

const TABS = ["directory", "admission", "import"] as const;

export default function StudentsPage() {
  const canAdmit = useCan("adm_admit_student");
  const [activeTab, setActiveTab] = useUrlTab("directory", canAdmit ? TABS : ["directory"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Admit students, look up records and import admissions in bulk."
        actions={
          <>
            <Button variant="outline">
              <FileDown data-icon="inline-start" />
              Export CSV
            </Button>
            {canAdmit ? (
              <Button onClick={() => setActiveTab("admission")}>
                <UserPlus data-icon="inline-start" />
                New admission
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="directory">
            <Users />
            Directory
          </TabsTrigger>
          {canAdmit ? (
            <>
              <TabsTrigger value="admission">
                <UserPlus />
                Admission form
              </TabsTrigger>
              <TabsTrigger value="import">
                <UploadCloud />
                Bulk import
              </TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="directory">
          <StudentDirectory />
        </TabsContent>
        {canAdmit ? (
          <>
            <TabsContent value="admission">
              <AdmissionForm />
            </TabsContent>
            <TabsContent value="import">
              <BulkImport />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
