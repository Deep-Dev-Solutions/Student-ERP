"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { MobileAttendanceList } from "@/features/teacher-portal/components/MobileAttendanceList";

const classOptions = [
  { value: "class-8", label: "Class 8" },
  { value: "class-9", label: "Class 9" },
  { value: "class-10", label: "Class 10" },
];
const sectionOptions = [
  { value: "section-a", label: "Section A" },
  { value: "section-b", label: "Section B" },
  { value: "section-c", label: "Section C" },
];

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("class-10");
  const [selectedSection, setSelectedSection] = useState("section-b");

  // Rendered on the client at request time (see teacher-portal/loading.tsx).
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <Card className="gap-4 px-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Mark attendance</h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          <Badge variant="info">Period 2</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LabeledSelect label="Class" options={classOptions} value={selectedClass} onValueChange={setSelectedClass} />
          <LabeledSelect label="Section" options={sectionOptions} value={selectedSection} onValueChange={setSelectedSection} />
        </div>
      </Card>

      <MobileAttendanceList />
    </div>
  );
}
