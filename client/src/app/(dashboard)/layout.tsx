"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 antialiased font-sans">
      {/* 1. Desktop Sidebar (hidden on mobile, fixed w-64 on md:) */}
      <div className="hidden md:block md:w-64 md:shrink-0 h-full">
        <Sidebar />
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation Header */}
        <Header />

        {/* Dynamic Page Content with beautiful framing */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}