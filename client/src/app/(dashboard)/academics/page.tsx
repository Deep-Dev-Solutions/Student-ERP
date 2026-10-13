"use client";

import { useUrlTab } from "@/hooks/use-url-state";
import { BookOpen, CalendarRange, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { CurrentBranchName } from "@/components/layout/CurrentBranchName";
import { ClassesPanel, SessionsPanel, SubjectsPanel } from "@/features/academics/components";

const TABS = ["classes", "subjects", "sessions"] as const;

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useUrlTab("classes", TABS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes and subjects"
        description={
          <>
            Classes, sections and class incharges at <CurrentBranchName />, the subjects each class takes, and academic sessions.
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="classes">
            <Layers />
            Classes and sections
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpen />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <CalendarRange />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <ClassesPanel />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsPanel />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
