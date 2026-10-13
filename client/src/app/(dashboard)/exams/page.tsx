"use client";

import { useUrlTab } from "@/hooks/use-url-state";
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
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  ExamSetup,
  MarksEntryGrid,
} from "@/features/exams/components";

const TABS = ["setup", "marks"] as const;

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useUrlTab("setup", TABS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams and marks"
        description="Schedule exams, set the date sheet and record marks for each subject."
        actions={
          <>
            <Button variant="outline">
              <FileSpreadsheet data-icon="inline-start" />
              Result sheet
            </Button>
            <Button onClick={() => setActiveTab("marks")}>
              <PenTool data-icon="inline-start" />
              Enter marks
            </Button>
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
        </TabsList>

        <TabsContent value="setup">
          <ExamSetup />
        </TabsContent>
        <TabsContent value="marks">
          <MarksEntryGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
