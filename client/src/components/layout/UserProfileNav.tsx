"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileNavProps {
  user?: {
    name: string;
    email: string;
    role: string;
    initials: string;
    avatarUrl?: string;
  };
}

export function UserProfileNav({
  user = {
    name: "Tayyab Saeed",
    email: "tayyab@erp.com",
    role: "System Administrator",
    initials: "TS",
  },
}: UserProfileNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="group flex items-center gap-2 rounded-full p-0.5 text-xs outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-600/30 cursor-pointer"
        aria-label="User navigation menu"
      >
        <Avatar className="size-9 border border-slate-200/90 shadow-xs transition-transform group-hover:scale-105">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
            {user.initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden lg:flex flex-col items-start text-left leading-tight pr-1">
          <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {user.role}
          </span>
        </div>

        <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-slate-400 group-data-[popup-open]:rotate-180 transition-transform duration-200" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-60 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg ring-1 ring-black/5"
      >
        {/* Signed in label header */}
        <div className="px-3 py-2">
          <div className="text-[11px] font-medium text-slate-500">
            Signed in as
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">
            {user.email}
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            <Sparkles className="h-3 w-3" /> Root Admin
          </span>
        </div>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        <div className="space-y-0.5">
          <DropdownMenuItem
            render={
              <Link
                href="/settings"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              />
            }
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Account Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            render={
              <Link
                href="/fees"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              />
            }
          >
            <CreditCard className="h-4 w-4 text-slate-500" />
            <span>Billing & Subscriptions</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        <DropdownMenuItem
          render={
            <Link
              href="/login"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
            />
          }
        >
          <LogOut className="h-4 w-4 text-rose-500" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

