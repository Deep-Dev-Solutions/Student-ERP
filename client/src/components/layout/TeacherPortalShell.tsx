"use client";

import { Suspense } from "react";
import { ArrowLeftRight, LayoutDashboard, UserRound } from "lucide-react";
import { MobileBottomNav, MobileBottomNavContent } from "@/components/layout/MobileBottomNav";
import { PortalSwitch, Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Header, HeaderContent } from "@/components/layout/Header";
import { toProfileUser, UserProfileNav } from "@/components/layout/UserProfileNav";
import { teacherNavGroups } from "@/components/layout/nav-config";
import { usePortalTeacher } from "@/features/teacher-portal/hooks";
import { useCanAccess } from "@/hooks/use-session";

/** The teacher portal's sidebar, header and bottom nav around its pages. */
export function TeacherPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const canOpenAdmin = useCanAccess("/dashboard");
  // Admins who open the portal see it as the demo teacher until real accounts exist.
  const { user: teacher } = usePortalTeacher();

  const sidebarProps = {
    groups: teacherNavGroups,
    subtitle: "Teacher portal",
    footer: canOpenAdmin ? <PortalSwitch href="/dashboard" label="Admin console" description="Switch to admin view" icon={ArrowLeftRight} /> : null,
  };
  const headerProps = {
    groups: teacherNavGroups,
    actions: (
      <UserProfileNav
        user={teacher ? toProfileUser(teacher) : undefined}
        links={[
          { href: "/teacher-portal", label: "My overview", icon: LayoutDashboard },
          { href: "/teacher-portal/profile", label: "My profile", icon: UserRound },
        ]}
      />
    ),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="hidden md:fixed md:inset-y-0 md:z-40 md:block md:w-62">
        {/* Dynamic routes (a class list) don't know the path while prerendering. */}
        <Suspense fallback={<SidebarContent {...sidebarProps} pathname="" />}>
          <Sidebar {...sidebarProps} />
        </Suspense>
      </div>

      <div className="flex flex-1 flex-col md:pl-62">
        <Suspense fallback={<HeaderContent {...headerProps} pathname="" />}>
          <Header {...headerProps} />
        </Suspense>

        {/* Bottom padding keeps content clear of the mobile bottom nav. */}
        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        <Suspense fallback={<MobileBottomNavContent pathname="" />}>
          <MobileBottomNav />
        </Suspense>
      </div>
    </div>
  );
}
