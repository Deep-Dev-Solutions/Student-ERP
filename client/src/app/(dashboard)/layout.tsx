"use client";

import * as React from "react";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PortalSwitch, Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Header, HeaderContent } from "@/components/layout/Header";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { ReadOnlyNotice } from "@/components/layout/ReadOnlyNotice";
import { PlanGate, ViewAsBanner } from "@/components/layout/PlanGate";
import { SessionSwitcher } from "@/components/layout/SessionSwitcher";
import { UserProfileNav } from "@/components/layout/UserProfileNav";
import { adminNavGroups } from "@/components/layout/nav-config";
import { useCanAccess, useVisibleNavGroups } from "@/hooks/use-session";

const subtitle = "Admin console";

function TeacherPortalSwitch({ onClick }: { onClick?: () => void }) {
  return (
    <PortalSwitch
      href="/teacher-portal"
      label="Teacher portal"
      description="Switch to faculty view"
      icon={Sparkles}
      onClick={onClick}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const groups = useVisibleNavGroups(adminNavGroups);
  const canOpenTeacherPortal = useCanAccess("/teacher-portal");
  const sidebarProps = { groups, subtitle, footer: canOpenTeacherPortal ? <TeacherPortalSwitch /> : null };
  const headerProps = {
    groups,
    mobileMenu: {
      subtitle,
      footer: (close: () => void) => (canOpenTeacherPortal ? <TeacherPortalSwitch onClick={close} /> : null),
    },
    actions: (
      <>
        <SessionSwitcher />
        <BranchSwitcher />
        <UserProfileNav />
      </>
    ),
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden h-full w-62 shrink-0 md:block">
        {/* Dynamic routes (a student's profile) don't know the path while prerendering. */}
        <Suspense fallback={<SidebarContent {...sidebarProps} pathname="" />}>
          <Sidebar {...sidebarProps} />
        </Suspense>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<HeaderContent {...headerProps} pathname="" />}>
          <Header {...headerProps} />
        </Suspense>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ViewAsBanner />
            <ReadOnlyNotice />
            <PlanGate>{children}</PlanGate>
          </div>
        </main>
      </div>
    </div>
  );
}
