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
  UserCheck,
  Lock,
  Bell,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { adminNavGroups } from "@/components/layout/nav-config";
import {
  MarkAttendanceUI,
  ReviewAndLock,
  AbsenceAlerts,
} from "@/features/attendance/components";

// Same count the sidebar shows next to Attendance.
const pendingLocks =
  adminNavGroups.flatMap((g) => g.items).find((i) => i.href === "/attendance")?.pending ?? 0;

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("mark");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark class registers, lock them at the end of the day and alert guardians about absences."
        actions={
          <>
            <Button variant="outline">
              <Download data-icon="inline-start" />
              Export monthly sheet
            </Button>
            <Button onClick={() => setActiveTab("review")}>
              <Lock data-icon="inline-start" />
              Review and lock
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="mark">
            <UserCheck />
            Mark attendance
          </TabsTrigger>
          <TabsTrigger value="review">
            <Lock />
            Review and lock
            <Badge variant="highlight" className="h-5 px-1.5">
              {pendingLocks}
              <span className="sr-only"> pending</span>
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell />
            Absence alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark">
          <MarkAttendanceUI />
        </TabsContent>
        <TabsContent value="review">
          <ReviewAndLock />
        </TabsContent>
        <TabsContent value="alerts">
          <AbsenceAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
