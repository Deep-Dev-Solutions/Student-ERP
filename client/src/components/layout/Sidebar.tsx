"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { isNavItemActive, type NavGroup } from "@/components/layout/nav-config";

interface SidebarProps {
  groups: NavGroup[];
  /** Short line under the brand name, e.g. the portal name. */
  subtitle?: string;
  /** Pinned to the bottom: portal switch, profile card, etc. */
  footer?: React.ReactNode;
  onItemClick?: () => void;
}

export function Sidebar(props: SidebarProps) {
  return <SidebarContent {...props} pathname={usePathname()} />;
}

/**
 * The sidebar for a given path. Layouts render it with an empty path as the
 * Suspense fallback on dynamic routes, where the path isn't known while
 * prerendering.
 */
export function SidebarContent({ groups, subtitle = BRAND.tagline, footer, onItemClick, pathname }: SidebarProps & { pathname: string }) {

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
        >
          D
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-base font-semibold tracking-tight">{BRAND.name}</span>
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">{group.label}</h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.pending ? (
                        <span className="rounded-full bg-highlight px-1.5 text-xs font-semibold leading-5 text-highlight-foreground tabular-nums">
                          {item.pending}
                          <span className="sr-only"> pending</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {footer ? <div className="border-t border-sidebar-border p-3">{footer}</div> : null}
    </aside>
  );
}

interface PortalSwitchProps {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export function PortalSwitch({ href, label, description, icon: Icon, onClick }: PortalSwitchProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border p-2.5 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="truncate text-xs text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}
