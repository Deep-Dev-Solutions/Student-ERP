"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  BookOpen,
  Settings,
  GraduationCap,
  Bell,
  Search,
  Menu,
  ChevronDown,
  Building2,
  Calendar,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/attendance", icon: UserCheck, label: "Attendance" },
  { href: "/fees", icon: CreditCard, label: "Fee Collection" },
  { href: "/staff", icon: Users, label: "Staff & HR" },
  { href: "/exams", icon: BookOpen, label: "Exams & Marks" },
];

const systemNavItems: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 antialiased">
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR                                        */}
      {/* ========================================================= */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Logo / Brand Area */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm ring-1 ring-blue-600/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-base">
                EduCore
              </span>
              <span className="rounded bg-blue-50 px-1 py-0.2 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                ERP
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Enterprise Suite
            </span>
          </div>
        </div>

        {/* Branch Context Pill */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/80 p-2 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              <div className="truncate font-medium text-slate-700">
                Lahore Central Campus
              </div>
            </div>
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Main Menu
              </div>
              <nav className="space-y-1">
                {mainNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </nav>
            </div>

            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                System
              </div>
              <nav className="space-y-1">
                {systemNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </nav>
            </div>
          </div>

          {/* Quick Upgrade / Status Promo */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-3.5 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-blue-900 mb-1">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Fall 2026 Session</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Admissions are currently active for grade 9 & 10.
            </p>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="border-t border-slate-200/80 p-3 bg-white">
          <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              TS
            </div>
            <div className="flex flex-1 flex-col overflow-hidden text-left">
              <span className="truncate text-xs font-semibold text-slate-900">
                Tayyab Shahid
              </span>
              <span className="truncate text-[11px] text-slate-500">
                Super Administrator
              </span>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT WRAPPER                                   */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Header with Backdrop Blur */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
          {/* Mobile Menu Trigger & Title */}
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5 text-slate-700" />
                    <span className="sr-only">Toggle navigation</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0 bg-white">
                <SheetHeader className="h-16 border-b border-slate-200/80 px-6 flex flex-row items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <SheetTitle className="text-base font-bold text-slate-900">
                    EduCore ERP
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-6">
                  <div>
                    <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Main Menu
                    </div>
                    <nav className="space-y-1">
                      {mainNavItems.map((item) => (
                        <SidebarNavLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </nav>
                  </div>
                  <div>
                    <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      System
                    </div>
                    <nav className="space-y-1">
                      {systemNavItems.map((item) => (
                        <SidebarNavLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-sm font-bold tracking-tight text-slate-900">
              EduCore ERP
            </span>
          </div>

          {/* Search Bar / Context (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, vouchers, staff (Ctrl + K)..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Term Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Fall Session 2026</span>
            </div>

            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-9 w-9"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-xs">
                      TS
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden sm:block" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900 leading-none">
                      Tayyab Shahid
                    </p>
                    <p className="text-xs text-slate-500 leading-none">
                      superadmin@educore.edu
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Switch Campus</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-slate-500" />
                  <span>System Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4 text-red-600" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// =========================================================
// HELPER: Sidebar Navigation Link with Active State
// =========================================================
function SidebarNavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        isActive
          ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-4 w-4 transition-colors ${
            isActive
              ? "text-blue-600"
              : "text-slate-400 group-hover:text-slate-700"
          }`}
        />
        <span>{item.label}</span>
      </div>

      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
      )}
    </Link>
  );
}