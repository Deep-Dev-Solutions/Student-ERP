"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserCheck,
  Award,
  FileSpreadsheet,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/teacher-portal",
    icon: Home,
  },
  {
    label: "Attendance",
    href: "/teacher-portal/attendance",
    icon: UserCheck,
  },
  {
    label: "Marks",
    href: "/teacher-portal/marks",
    icon: Award,
  },
  {
    label: "Paper Maker",
    href: "/teacher-portal/paper-maker",
    icon: FileSpreadsheet,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-50 block border-t border-slate-200/80 bg-white/95 backdrop-blur-md pb-safe md:hidden shadow-lg shadow-slate-900/5"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/teacher-dashboard" &&
              pathname?.startsWith(item.href)) ||
            (item.href === "/teacher-dashboard" &&
              (pathname === "/teacher-dashboard" || pathname === "/"));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 active:scale-95"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 group-hover:text-slate-700"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

