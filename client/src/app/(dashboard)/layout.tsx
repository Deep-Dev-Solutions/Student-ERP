"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { PortalSwitch, Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { UserProfileNav } from "@/components/layout/UserProfileNav";
import { adminNavGroups } from "@/components/layout/nav-config";

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
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden h-full w-62 shrink-0 md:block">
        <Sidebar groups={adminNavGroups} subtitle={subtitle} footer={<TeacherPortalSwitch />} />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          groups={adminNavGroups}
          mobileMenu={{
            subtitle,
            footer: (close) => <TeacherPortalSwitch onClick={close} />,
          }}
          actions={
            <>
              <BranchSwitcher />
              <UserProfileNav />
            </>
          }
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
