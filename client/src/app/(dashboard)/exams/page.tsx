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
  Calendar,
  PenTool,
  FileSpreadsheet,
  Award,
  Sparkles,
} from "lucide-react";
import {
  ExamSetup,
  MarksEntryGrid,
} from "@/features/exams/components";

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState("setup");

  return (
    <div className="space-y-6">
      {/* 1. Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Examinations & Marks
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Term Evaluation
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Schedule academic assessment sessions, configure datesheets, and record student marks into gradebooks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Consolidated Result Sheet
          </Button>
          <Button
            onClick={() => setActiveTab("marks")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <PenTool className="mr-1.5 h-3.5 w-3.5" />
            Enter Subject Marks
          </Button>
        </div>
      </div>

      {/* 2. Modern Pill-Shaped Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-3">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="setup"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:text-slate-900 data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Calendar className="h-4 w-4" />
              <span>Exam Setup</span>
            </TabsTrigger>

            <TabsTrigger
              value="marks"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:text-slate-900 data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Award className="h-4 w-4" />
              <span>Enter Marks</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Exam Setup */}
        <TabsContent
          value="setup"
          className="mt-0 focus-visible:outline-none"
        >
          <ExamSetup />
        </TabsContent>

        {/* Tab 2: Marks Entry Grid */}
        <TabsContent
          value="marks"
          className="mt-0 focus-visible:outline-none"
        >
          <MarksEntryGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}

