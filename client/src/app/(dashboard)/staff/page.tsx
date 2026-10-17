"use client";

import { useCan } from "@/hooks/use-session";
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
  const [activeTab, setActiveTab] = useUrlTab("directory", canSeePayroll ? TABS : ["directory", "allocations"]);

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
