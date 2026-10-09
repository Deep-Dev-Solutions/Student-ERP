"use client";

import { useState } from "react";
import {
  Building2,
  ShieldCheck,
  Sparkles,
  Sliders,
  Bell,
  Database,
  Lock,
} from "lucide-react";
import { CampusProfile, RolesMatrix } from "@/features/settings/components";

type SettingsTab = "profile" | "roles";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("roles");

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              System Settings & Administration
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Security & Identity
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage institutional profile metadata, global credentials, and Role-Based Access Control policies.
          </p>
        </div>
      </div>

      {/* 2. Left-Aligned Vertical Tabs Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Vertical Navigation Menu (3 cols) */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              General Configuration
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Building2
                className={`h-4 w-4 shrink-0 ${
                  activeTab === "profile" ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div>Campus Profile</div>
                <div className="text-[11px] font-normal text-slate-400">
                  Name, crest & address
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "roles"
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ShieldCheck
                className={`h-4 w-4 shrink-0 ${
                  activeTab === "roles" ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div>Roles & Permissions</div>
                <div className="text-[11px] font-normal text-slate-400">
                  RBAC privilege matrix
                </div>
              </div>
            </button>

            {/* Inactive feature previews */}
            <div className="pt-3 border-t border-slate-100">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Security & Audit
              </div>

              <div className="flex items-center justify-between rounded-lg px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-slate-300" />
                  <span>2FA & Sessions</span>
                </div>
                <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                  Enterprise
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-slate-300" />
                  <span>Backup & Restore</span>
                </div>
                <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                  Cloud
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area (9 cols) */}
        <main className="lg:col-span-9">
          {activeTab === "profile" && <CampusProfile />}
          {activeTab === "roles" && <RolesMatrix />}
        </main>
      </div>
    </div>
  );
}

