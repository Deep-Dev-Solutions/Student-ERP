"use client";

import { useState } from "react";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlTab } from "@/hooks/use-url-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Lock,
  Bell,
  Download,
  IdCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  MarkAttendanceUI,
  ReviewAndLock,
  AbsenceAlerts,
  MonthlySheetDialog,
  StaffAttendance,
} from "@/features/attendance/components";
import { isLocked, useToday } from "@/features/attendance/hooks";
import { useOutboxFlush } from "@/features/attendance/useRegisterEditor";
import { useGetRegistersQuery, useGetSchoolRulesQuery, useGetUnlockRequestsQuery } from "@/store/api";

const TABS = ["mark", "review", "alerts", "staff"] as const;

export default function AttendancePage() {
  const canLock = useCan("att_lock_roster");
  const [activeTab, setActiveTab] = useUrlTab("mark", canLock ? TABS : ["mark", "alerts", "staff"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  useOutboxFlush();

  // Today's registers still open, plus requests to reopen: what Review needs to look at.
  const today = useToday();
  const branch = useCurrentBranch();
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: requests = [] } = useGetUnlockRequestsQuery();
  const pendingLocks =
    registers.filter((r) => r.branchId === branch?.id && r.date === today && !isLocked(r, today, rules)).length +
    requests.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark class and staff registers, lock them at the end of the day and alert guardians about absences."
        actions={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              <Download data-icon="inline-start" />
              Export monthly sheet
            </Button>
            {canLock ? (
              <Button onClick={() => setActiveTab("review")}>
                <Lock data-icon="inline-start" />
                Review and lock
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="mark">
            <UserCheck />
            Mark attendance
          </TabsTrigger>
          {canLock ? (
            <TabsTrigger value="review">
              <Lock />
              Review and lock
              {pendingLocks > 0 ? (
                <Badge variant="highlight" className="h-5 px-1.5">
                  {pendingLocks}
                  <span className="sr-only"> pending</span>
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="alerts">
            <Bell />
            Absence alerts
          </TabsTrigger>
          <TabsTrigger value="staff">
            <IdCard />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark">
          <MarkAttendanceUI />
        </TabsContent>
        {canLock ? (
          <TabsContent value="review">
            <ReviewAndLock />
          </TabsContent>
        ) : null}
        <TabsContent value="alerts">
          <AbsenceAlerts />
        </TabsContent>
        <TabsContent value="staff">
          <StaffAttendance />
        </TabsContent>
      </Tabs>

      {sheetOpen ? <MonthlySheetDialog onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}
