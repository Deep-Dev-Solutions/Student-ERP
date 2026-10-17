"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavItemActive, teacherNavGroups } from "@/components/layout/nav-config";

const shortLabels: Record<string, string> = {
  "/teacher-portal": "Home",
  "/teacher-portal/classes": "Classes",
  "/teacher-portal/attendance": "Attendance",
  "/teacher-portal/marks": "Marks",
  "/teacher-portal/paper-maker": "Papers",
};

const navItems = teacherNavGroups.flatMap((group) => group.items);

export function MobileBottomNav() {
  return <MobileBottomNavContent pathname={usePathname()} />;
}

/** The bar itself; takes the path so it can render before the path is known (prerendering). */
export function MobileBottomNavContent({ pathname }: { pathname: string }) {

  return (
    <nav
      aria-label="Teacher portal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                  active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-secondary"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {shortLabels[item.href] ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
