"use client";

import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useGetTenantsQuery } from "@/store/api";
import { useAdminNotices, useTeacherNotices, type Notice } from "../useNotifications";

const dot = { danger: "bg-danger", warning: "bg-warning", info: "bg-info" } as const;

function Menu({ notices }: { notices: Notice[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={notices.length ? `Notifications, ${notices.length} need attention` : "Notifications"}
            className="relative"
          />
        }
      >
        <Bell className="size-4" />
        {notices.length ? <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-highlight ring-2 ring-card" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
          {notices.length === 0 ? (
            <p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <CheckCircle2 aria-hidden className="size-4 text-success" />
              You&apos;re all caught up.
            </p>
          ) : (
            notices.map((n) => (
              <DropdownMenuItem key={n.id} render={<Link href={n.href} />} className="items-start gap-2.5 py-2 whitespace-normal">
                <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot[n.tone])} />
                <span>{n.title}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminNotifications() {
  return <Menu notices={useAdminNotices()} />;
}

/** Platform notices: schools on trial and suspended schools. */
function ConsoleNotifications() {
  const { data: tenants = [] } = useGetTenantsQuery();
  const trial = tenants.filter((t) => t.status === "trial");
  const suspended = tenants.filter((t) => t.status === "suspended");
  const notices: Notice[] = [
    ...trial.map((t) => ({ id: `trial-${t.id}`, tone: "info" as const, title: `${t.name} is on trial`, href: `/console/${t.id}` })),
    ...suspended.map((t) => ({ id: `sus-${t.id}`, tone: "danger" as const, title: `${t.name} is suspended`, href: `/console/${t.id}` })),
  ];
  return <Menu notices={notices} />;
}

function TeacherNotifications() {
  return <Menu notices={useTeacherNotices()} />;
}

/** The bell in the header: what needs attention in this portal, each linking to the task. */
export function NotificationsMenu({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/console")) return <ConsoleNotifications />;
  return pathname.startsWith("/teacher-portal") ? <TeacherNotifications /> : <AdminNotifications />;
}
