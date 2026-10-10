"use client";

import * as React from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
        className="group flex h-9.5 items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 active:scale-[0.99] cursor-pointer"
        aria-label="Switch active branch"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-200/60">
          <Building2 className="h-3.5 w-3.5" />
        </div>

        <div className="flex flex-col items-start text-left leading-tight">
          <span className="font-semibold text-slate-900 max-w-[130px] sm:max-w-[170px] truncate">
            {selectedBranch.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedBranch.code}
          </span>
        </div>

        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-data-[popup-open]:rotate-180 ml-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-64 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg ring-1 ring-black/5"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Branches & Campuses
        </DropdownMenuLabel>

        <div className="space-y-0.5">
          {branches.map((branch) => {
            const isSelected = selectedBranch.id === branch.id;
            return (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/70 text-blue-900 font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs">{branch.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {branch.location}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        <div className="px-2 py-1 text-[11px] text-slate-400 text-center">
          Multi-campus data filtered in real-time
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

