"use client";

import { CalendarRange, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelectedSession } from "@/hooks/use-academics";
import { formatDate } from "@/lib/format";
import { useGetSessionsQuery } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { sessionSelected } from "@/store/sessionSlice";

/** Academic session picker, styled to match the campus switcher. Past sessions open read-only. */
export function SessionSwitcher() {
  const dispatch = useAppDispatch();
  const { data: sessions = [] } = useGetSessionsQuery();
  const { session: selected } = useSelectedSession();
  if (!selected) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Session: ${selected.label}. Change session`}
        className="group flex h-9 items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <CalendarRange className="size-4 shrink-0 text-primary" />
        <span className="hidden font-medium tabular-nums lg:inline">{selected.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-64 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-1.5">Academic sessions</DropdownMenuLabel>
          {sessions.map((s) => {
            const isSelected = selected.id === s.id;
            return (
              <DropdownMenuItem
                key={s.id}
                onClick={() => dispatch(sessionSelected(s.id))}
                className="items-start gap-2.5 rounded-md px-2.5 py-2"
              >
                <CalendarRange className={`mt-0.5 size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className={`truncate text-sm tabular-nums ${isSelected ? "font-semibold" : "font-medium"}`}>
                    {s.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.current ? "Current session" : `Read-only · ended ${formatDate(s.endDate)}`}
                  </span>
                </span>
                {isSelected ? <Check className="mt-0.5 size-4 text-primary" aria-label="Selected" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
