"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Home,
  UserCheck,
  Award,
  FileSpreadsheet,
  Bell,
  Sparkles,
} from "lucide-react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const desktopNavItems: NavItem[] = [
  {
    label: "Overview",
    href: "/teacher-dashboard",
    icon: Home,
  },
  {
    label: "Mark Attendance",
    href: "/teacher-dashboard/attendance",
    icon: UserCheck,
  },
  {
    label: "Marks & Grades",
    href: "/teacher-dashboard/marks",
    icon: Award,
  },
  {
    label: "Exam Paper Maker",
    href: "/teacher-dashboard/paper-maker",
    icon: FileSpreadsheet,
  },
];

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Slim Left-Side Navigation (hidden on mobile, visible on md:) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-200/80 bg-white shadow-xs">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 tracking-tight leading-none">
              Apex Academy
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">
              Teacher Portal
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Teaching Workflows
          </div>
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/teacher-dashboard" &&
                pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Teacher Profile Footer Card */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
              TM
            </div>
            <div className="overflow-hidden">
              <div className="truncate text-xs font-semibold text-slate-900">
                Dr. Tariq Mahmood
              </div>
              <div className="truncate text-[11px] text-slate-500">
                Physics Faculty (STF-201)
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Top Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md shadow-xs">
          {/* Logo & School Name */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs md:hidden">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight">
                Apex Academy
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Term Session 2026-27</span>
              </div>
            </div>
          </div>

          {/* Right Header items: Notification & Teacher Avatar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-xs"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-2 pl-1 border-l border-slate-200/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs text-white shadow-xs">
                TM
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900">
                  Dr. Tariq Mahmood
                </div>
                <div className="text-[10px] text-slate-400">Faculty</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with safe padding for Mobile Bottom Nav */}
        <main className="flex-1 pb-24 md:pb-8">
          {children}
        </main>

        {/* Fixed Mobile Bottom Nav (hidden on desktop) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}

