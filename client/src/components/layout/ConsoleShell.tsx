"use client";

import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { Header, HeaderContent } from "@/components/layout/Header";
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { UserProfileNav } from "@/components/layout/UserProfileNav";
import { consoleNavGroups } from "@/components/layout/nav-config";

const subtitle = "Platform console";

/** The platform console: schools, their modules, and the global question bank. */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const sidebarProps = { groups: consoleNavGroups, subtitle, footer: null };
  const headerProps = {
    groups: consoleNavGroups,
    mobileMenu: { subtitle },
    actions: <UserProfileNav links={[{ href: "/console", label: "Schools", icon: LayoutDashboard }]} />,
  };
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden h-full w-62 shrink-0 md:block">
        <Suspense fallback={<SidebarContent {...sidebarProps} pathname="" />}>
          <Sidebar {...sidebarProps} />
        </Suspense>
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<HeaderContent {...headerProps} pathname="" />}>
          <Header {...headerProps} />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Dynamic routes (a school's page) read the URL, which isn't known while prerendering. */}
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={null}>{children}</Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
