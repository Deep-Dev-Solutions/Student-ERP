"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Banknote,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  StaffDirectory,
  TeacherAllocations,
  PayrollList,
} from "@/features/staff/components";

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff and HR"
        description="Staff records, subject and class allocations, and monthly payroll."
        actions={
          <>
            <Button variant="outline">
              <FileSpreadsheet data-icon="inline-start" />
              Monthly attendance report
            </Button>
            <Button onClick={() => setActiveTab("directory")}>
              <UserPlus data-icon="inline-start" />
              Add staff member
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
          <TabsTrigger value="allocations">
            <GraduationCap />
            Teaching allocations
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <Banknote />
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <StaffDirectory />
        </TabsContent>
        <TabsContent value="allocations">
          <TeacherAllocations />
        </TabsContent>
        <TabsContent value="payroll">
          <PayrollList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
