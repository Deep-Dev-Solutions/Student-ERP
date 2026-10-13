"use client";

import * as React from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
}

const branches: Branch[] = [
  {
    id: "br-1",
    name: "Lahore Central Campus",
    code: "LHR-01",
    location: "Main Boulevard, Gulberg III",
  },
  {
    id: "br-2",
    name: "Gulberg Campus",
    code: "GLB-02",
    location: "Block B, Gulberg II",
  },
  {
    id: "br-3",
    name: "DHA Branch",
    code: "DHA-03",
    location: "Phase 5 Commercial, DHA",
  },
  {
    id: "br-4",
    name: "Johar Town Campus",
    code: "JT-04",
    location: "G-Block, Johar Town",
  },
];

export function BranchSwitcher() {
  const [selectedBranch, setSelectedBranch] = React.useState<Branch>(branches[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Campus: ${selectedBranch.name}. Change campus`}
        className="group flex h-9 items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Building2 className="size-4 shrink-0 text-primary" />
        <span className="hidden max-w-[11rem] truncate font-medium sm:inline">
          {selectedBranch.name}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-72 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-1.5">Campuses</DropdownMenuLabel>
          {branches.map((branch) => {
            const isSelected = selectedBranch.id === branch.id;
            return (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className="items-start gap-2.5 rounded-md px-2.5 py-2"
              >
                <Building2
                  className={`mt-0.5 size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className={`truncate text-sm ${isSelected ? "font-semibold" : "font-medium"}`}>
                    {branch.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {branch.code} · {branch.location}
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
