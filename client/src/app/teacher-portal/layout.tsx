"use client";

import { ArrowLeftRight, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PortalSwitch, Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { toProfileUser, UserProfileNav } from "@/components/layout/UserProfileNav";
import { teacherNavGroups } from "@/components/layout/nav-config";
import { useCanAccess, useCurrentUser } from "@/hooks/use-session";
import { DEMO_TEACHER_ID } from "@/mocks/users";
import { useGetUsersQuery } from "@/store/api";

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useCurrentUser();
  const { data: users } = useGetUsersQuery();
  const canOpenAdmin = useCanAccess("/dashboard");
  // Admins who open the portal see it as the demo teacher until real accounts exist.
  const teacher = currentUser?.role === "teacher" ? currentUser : users?.find((u) => u.id === DEMO_TEACHER_ID);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="hidden md:fixed md:inset-y-0 md:z-40 md:block md:w-62">
        <Sidebar
          groups={teacherNavGroups}
          subtitle="Teacher portal"
          footer={
            canOpenAdmin ? (
              <PortalSwitch
                href="/dashboard"
                label="Admin console"
                description="Switch to admin view"
                icon={ArrowLeftRight}
              />
            ) : null
          }
        />
      </div>

      <div className="flex flex-1 flex-col md:pl-62">
        <Header
          groups={teacherNavGroups}
          actions={
            <UserProfileNav
              user={teacher ? toProfileUser(teacher) : undefined}
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
