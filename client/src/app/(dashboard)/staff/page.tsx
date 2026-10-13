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

const TABS = ["directory", "allocations", "payroll"] as const;

export default function StaffPage() {
  const canSeePayroll = useCan("fin_manage_payroll");
  const [activeTab, setActiveTab] = useUrlTab("directory", canSeePayroll ? TABS : ["directory", "allocations"]);

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
          {canSeePayroll ? (
            <TabsTrigger value="payroll">
              <Banknote />
              Payroll
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="directory">
          <StaffDirectory />
        </TabsContent>
        <TabsContent value="allocations">
          <TeacherAllocations />
        </TabsContent>
        {canSeePayroll ? (
          <TabsContent value="payroll">
            <PayrollList />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
