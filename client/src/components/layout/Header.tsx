"use client";

import * as React from "react";
import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { UserProfileNav } from "@/components/layout/UserProfileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md shadow-xs">
      {/* Left Side: Mobile Hamburger Menu (visible only on max-md) */}
      <div className="flex items-center gap-3">
        <div className="block md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 shadow-xs"
                  aria-label="Open navigation sidebar"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 p-0 bg-white border-r border-slate-200"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Search quick button or breadcrumb hint */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-700">Apex Enterprise ERP</span>
          <span>/</span>
          <span className="text-slate-500">Administration Console</span>
        </div>
      </div>

      {/* Right Side: BranchSwitcher + UserProfileNav with gap-4 */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification bell button */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-xs transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* Branch Switcher (Multi-campus selector) */}
        <BranchSwitcher />

        {/* User Profile Navigation */}
        <UserProfileNav />
      </div>
    </header>
  );
}

