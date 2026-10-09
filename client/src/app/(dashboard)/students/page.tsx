"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  UploadCloud,
  FileDown,
} from "lucide-react";
import {
  StudentDirectory,
  AdmissionForm,
  BulkImport,
} from "@/features/students/components";

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Admit, monitor, and manage student directories and academic profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <FileDown className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </Button>
          <Button
            onClick={() => setActiveTab("admission")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            New Admission
          </Button>
        </div>
      </div>

      {/* 2. Modern Pill-Shaped Tabs & Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-4">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="directory"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Student Directory</span>
              <span className="rounded-full bg-slate-200/70 data-active:bg-blue-50 data-active:text-blue-700 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                1,245
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="admission"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Admission Form</span>
            </TabsTrigger>

            <TabsTrigger
              value="import"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Bulk Excel Import</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Directory */}
        <TabsContent value="directory" className="focus-visible:outline-none">
          <StudentDirectory />
        </TabsContent>

        {/* Tab 2: Admission Form */}
        <TabsContent value="admission" className="focus-visible:outline-none">
          <AdmissionForm />
        </TabsContent>

        {/* Tab 3: Bulk Import */}
        <TabsContent value="import" className="focus-visible:outline-none">
          <BulkImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}