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
  Sparkles,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

export const adminNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/attendance", icon: UserCheck, label: "Attendance" },
  { href: "/fees", icon: CreditCard, label: "Fee Collection" },
  { href: "/staff", icon: Users, label: "Staff & HR" },
  { href: "/exams", icon: BookOpen, label: "Exams & Marks" },
];

export const systemNavItems: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200/80 bg-white">
      {/* 1. Logo & Brand Title */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
          <GraduationCap className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
              Apex ERP
            </span>
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 leading-none">
              v2.0
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1">
            Enterprise School Suite
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Academic Operations
          </div>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-blue-600 stroke-[2.2]"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            System & Administration
          </div>
          <nav className="space-y-1">
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-blue-600 stroke-[2.2]"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. Bottom Teacher Portal Switcher Pill */}
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/teacher-portal"
          onClick={onItemClick}
          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-blue-50/60 hover:border-blue-200 hover:text-blue-700"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-semibold text-slate-900">Teacher Portal</span>
              <span className="text-[10px] text-slate-400">Switch to faculty view</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

