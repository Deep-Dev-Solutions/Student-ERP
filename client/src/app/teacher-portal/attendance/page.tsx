"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { useClassSectionPicker } from "@/hooks/use-academics";
import { useCurrentBranch, useCurrentUser } from "@/hooks/use-session";
import { useToday } from "@/features/attendance/hooks";
import { useGetClassesQuery, useGetSectionsQuery } from "@/store/api";
import { MobileAttendanceList } from "@/features/teacher-portal/components/MobileAttendanceList";


export default function TeacherAttendancePage() {
  const user = useCurrentUser();
  const branch = useCurrentBranch();
  const isoToday = useToday();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  // A class incharge starts on their own section.
  const ownSection = sections.find((s) => user?.staffId && s.inchargeId === user.staffId);
  const ownClass = classes.find((c) => c.id === ownSection?.classId);
  const picker = useClassSectionPicker(ownSection && ownClass ? { className: ownClass.name, section: ownSection.name } : { className: "Class 10", section: "B" });

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
          <LabeledSelect label="Class" options={picker.classOptions} value={picker.classId} onValueChange={picker.setClassId} />
          <LabeledSelect label="Section" options={picker.sectionOptions} value={picker.sectionId} onValueChange={picker.setSectionId} />
        </div>
      </Card>

      <MobileAttendanceList branchId={branch?.id ?? ""} classId={picker.classId} sectionId={picker.sectionId} date={isoToday ?? ""} />
    </div>
  );
}
