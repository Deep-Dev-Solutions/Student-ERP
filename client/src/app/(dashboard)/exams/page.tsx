"use client";

import { useUrlTab } from "@/hooks/use-url-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button";
import {
  Calendar,
  PenTool,
  FileSpreadsheet,
  Award,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  ExamSetup,
  MarksEntryGrid,
  ResultsPanel,
} from "@/features/exams/components";

const TABS = ["setup", "marks", "results"] as const;

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useUrlTab("setup", TABS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams and marks"
        description="Schedule exams, set the date sheet and record marks for each subject."
        actions={
          <>
            <ButtonLink href="/exams?tab=results" variant="outline">
              <FileSpreadsheet data-icon="inline-start" />
              Result sheet
            </ButtonLink>
            <ButtonLink href="/exams?tab=marks">
              <PenTool data-icon="inline-start" />
              Enter marks
            </ButtonLink>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="setup">
            <Calendar />
            Exam setup
          </TabsTrigger>
          <TabsTrigger value="marks">
            <Award />
            Enter marks
          </TabsTrigger>
          <TabsTrigger value="results">
            <Trophy />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <ExamSetup />
        </TabsContent>
        <TabsContent value="marks">
          <MarksEntryGrid />
        </TabsContent>
        <TabsContent value="results">
          <ResultsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
