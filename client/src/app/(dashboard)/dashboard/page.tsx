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
  QuickActions,
  TodayRegister,
} from "@/features/dashboard/components";
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
            <ButtonLink href="/students/new">
              <Plus data-icon="inline-start" />
              Admit student
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <TodayRegister />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
          <FeeTargetCard />
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
        </div>

        <div className="min-w-0 lg:col-span-7">
          <FeeCollectionChart />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <AttendanceTrendChart />
        </div>

        <div className="min-w-0 lg:col-span-8">
          <ActivityFeed />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
