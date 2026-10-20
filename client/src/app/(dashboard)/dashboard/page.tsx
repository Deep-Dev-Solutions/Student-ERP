import type { Metadata } from "next";
import { Download, Plus, UsersRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CurrentBranchName } from "@/components/layout/CurrentBranchName";
import { StatCard } from "@/components/shared/StatCard";
import {
  ActivityFeed,
  AttendanceTrendChart,
  FeeCollectionChart,
  FeeTargetCard,
  PapersCard,
  QuickActions,
  TodayRegister,
} from "@/features/dashboard/components";
import { DashboardAlerts } from "@/features/notifications/components/DashboardAlerts";
import { SetupChecklist } from "@/features/notifications/components/SetupChecklist";
import { ModuleOnly } from "@/components/layout/PlanGate";
import { studentsSummary } from "@/services/dashboard";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Today&apos;s attendance, fee collection and admissions for <CurrentBranchName />.
          </>
        }
        actions={
          <>
            <Button variant="outline">
              <Download data-icon="inline-start" />
              Export summary
            </Button>
            <ModuleOnly module="students">
              <ButtonLink href="/students/new">
                <Plus data-icon="inline-start" />
                Admit student
              </ButtonLink>
            </ModuleOnly>
          </>
        }
      />

      <DashboardAlerts />
      <SetupChecklist />

      <div className="grid gap-4 lg:grid-cols-12">
        <ModuleOnly module="attendance">
          <div className="min-w-0 lg:col-span-8">
            <TodayRegister />
          </div>
        </ModuleOnly>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
          <ModuleOnly module="fees">
            <FeeTargetCard />
          </ModuleOnly>
          <ModuleOnly module="students">
            <StatCard
              label="Enrolled students"
              icon={UsersRound}
              value={formatNumber(studentsSummary.total)}
              footer={
                <>
                  <span className="font-medium text-success">+{studentsSummary.admittedThisMonth}</span>{" "}
                  admitted this month
                </>
              }
            />
          </ModuleOnly>
        </div>

        <ModuleOnly module="fees">
          <div className="min-w-0 lg:col-span-7">
            <FeeCollectionChart />
          </div>
        </ModuleOnly>
        <ModuleOnly module="attendance">
          <div className="min-w-0 lg:col-span-5">
            <AttendanceTrendChart />
          </div>
        </ModuleOnly>
        <ModuleOnly module="paper_maker">
          <div className="min-w-0 lg:col-span-12">
            <PapersCard />
          </div>
        </ModuleOnly>

        <ModuleOnly module="students">
          <div className="min-w-0 lg:col-span-8">
            <ActivityFeed />
          </div>
        </ModuleOnly>
        <div className="min-w-0 lg:col-span-4">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
