"use client";

import { ArrowLeftRight, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PortalSwitch, Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserProfileNav, type ProfileUser } from "@/components/layout/UserProfileNav";
import { teacherNavGroups } from "@/components/layout/nav-config";

const teacher: ProfileUser = {
  name: "Dr. Tariq Mahmood",
  email: "tariq.mahmood@erp.com",
  role: "Physics faculty",
  initials: "TM",
};

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="hidden md:fixed md:inset-y-0 md:z-40 md:block md:w-62">
        <Sidebar
          groups={teacherNavGroups}
          subtitle="Teacher portal"
          footer={
            <PortalSwitch
              href="/dashboard"
              label="Admin console"
              description="Switch to admin view"
              icon={ArrowLeftRight}
            />
          }
        />
      </div>

      <div className="flex flex-1 flex-col md:pl-62">
        <Header
          groups={teacherNavGroups}
          actions={
            <UserProfileNav
              user={teacher}
              links={[{ href: "/teacher-portal", label: "My overview", icon: LayoutDashboard }]}
            />
          }
        />

        {/* Bottom padding keeps content clear of the mobile bottom nav. */}
        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
