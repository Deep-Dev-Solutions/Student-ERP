"use client";

import { useState } from "react";
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

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState("directory");

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
            <Button onClick={() => setActiveTab("admission")}>
              <UserPlus data-icon="inline-start" />
              New admission
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="directory">
            <Users />
            Directory
          </TabsTrigger>
          <TabsTrigger value="admission">
            <UserPlus />
            Admission form
          </TabsTrigger>
          <TabsTrigger value="import">
            <UploadCloud />
            Bulk import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <StudentDirectory />
        </TabsContent>
        <TabsContent value="admission">
          <AdmissionForm />
        </TabsContent>
        <TabsContent value="import">
          <BulkImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
