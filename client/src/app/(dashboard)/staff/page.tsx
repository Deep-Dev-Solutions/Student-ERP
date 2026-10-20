"use client";

import { useCan, useModules } from "@/hooks/use-session";
import { useUrlTab } from "@/hooks/use-url-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button";
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
  const canAddStaff = useCan("adm_onboard_staff");
  // Allocations need classes (Students module); payroll needs the Payroll module (useCan checks it).
  const hasClasses = useModules().has("students");
  const tabs = TABS.filter((t) => (t !== "payroll" || canSeePayroll) && (t !== "allocations" || hasClasses));
  const [activeTab, setActiveTab] = useUrlTab("directory", tabs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff and HR"
        description="Staff records, subject and class allocations, and monthly payroll."
        actions={
          <>
            <ButtonLink href="/attendance?tab=staff" variant="outline">
              <FileSpreadsheet data-icon="inline-start" />
              Monthly attendance report
            </ButtonLink>
            {canAddStaff ? (
              <ButtonLink href="/staff/new">
                <UserPlus data-icon="inline-start" />
                Add staff member
              </ButtonLink>
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
          {hasClasses ? (
            <TabsTrigger value="allocations">
              <GraduationCap />
              Teaching allocations
            </TabsTrigger>
          ) : null}
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
        {hasClasses ? (
          <TabsContent value="allocations">
            <TeacherAllocations />
          </TabsContent>
        ) : null}
        {canSeePayroll ? (
          <TabsContent value="payroll">
            <PayrollList />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
