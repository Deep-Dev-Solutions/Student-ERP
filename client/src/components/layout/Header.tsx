"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/Sidebar";
import { getBreadcrumbs, type NavGroup } from "@/components/layout/nav-config";
import { NotificationsMenu } from "@/features/notifications/components/NotificationsMenu";

interface HeaderProps {
  groups: NavGroup[];
  /** Right-hand controls (campus switcher, profile menu, …). */
  actions?: React.ReactNode;
  /** Render the slide-out navigation on small screens. Off when a bottom nav is used. */
  mobileMenu?: {
    subtitle?: string;
    footer?: (close: () => void) => React.ReactNode;
  };
}

export function Header(props: HeaderProps) {
  return <HeaderContent {...props} pathname={usePathname()} />;
}

/** The header for a given path; see SidebarContent for why the path is a prop. */
export function HeaderContent({ groups, actions, mobileMenu, pathname }: HeaderProps & { pathname: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const crumbs = getBreadcrumbs(pathname, groups);
  const current = crumbs.at(-1);
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {mobileMenu ? (
          <div className="md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={<Button variant="outline" size="icon" aria-label="Open navigation" />}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" showCloseButton={false} className="w-64 gap-0 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent
                  pathname={pathname}
                  groups={groups}
                  subtitle={mobileMenu.subtitle}
                  footer={mobileMenu.footer?.(close)}
                  onItemClick={close}
                />
              </SheetContent>
            </Sheet>
          </div>
        ) : null}

        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="min-w-0">
            {/* Small screens: just the current page. */}
            <p className="truncate text-sm font-semibold sm:hidden">{current?.label}</p>
            <ol className="hidden items-center gap-1.5 text-sm sm:flex">
              {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {i > 0 ? <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" /> : null}
                    {isLast ? (
                      <span aria-current="page" className="font-semibold text-foreground">
                        {crumb.label}
                      </span>
                    ) : crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{crumb.label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationsMenu pathname={pathname} />
        {actions}
      </div>
    </header>
  );
}
