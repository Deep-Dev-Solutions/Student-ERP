"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/shared/FormFields";
import { classLabel, sectionLabel, useBranchClasses, useClassSections } from "@/hooks/use-academics";
import { downloadFile, toCsv } from "@/lib/csv";
import { useGetRegistersQuery, useGetSchoolRulesQuery, useGetStudentsQuery } from "@/store/api";
import { holidayOn, useToday } from "../hooks";

const LETTER = { present: "P", absent: "A", leave: "L" } as const;

/** Downloads a section's month as a CSV: one row per student, one column per day. */
export function MonthlySheetDialog({ onClose }: { onClose: () => void }) {
  const today = useToday();
  const classes = useBranchClasses();
  const [classId, setClassId] = useState(classes.find((c) => c.name === "Class 9")?.id ?? classes[0]?.id ?? "");
  const sections = useClassSections(classId);
  const [sectionId, setSectionId] = useState("");
  const section = sections.find((s) => s.id === sectionId) ?? sections[0];
  const [month, setMonth] = useState(() => (today ?? "2026-10-01").slice(0, 7));
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: rules } = useGetSchoolRulesQuery();

  const download = () => {
    if (!section || !/^\d{4}-\d{2}$/.test(month)) return;
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const dates = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
    const monthRegisters = registers.filter((r) => r.sectionId === section.id && r.date.startsWith(month) && !r.subjectId);
    const roster = students
      .filter((s) => s.sectionId === section.id && (s.enrollment === "active" || monthRegisters.some((r) => r.marks[s.id])))
      .sort((a, b) => a.name.localeCompare(b.name));

    const rows = roster.map((s) => {
      const cells = dates.map((d) => {
        if (holidayOn(d, rules)) return "H";
        const mark = monthRegisters.find((r) => r.date === d)?.marks[s.id];
        return mark ? LETTER[mark.status] : "";
      });
      const present = cells.filter((c) => c === "P").length;
      const marked = cells.filter((c) => c === "P" || c === "A" || c === "L").length;
      return [s.id, s.name, ...cells, present, cells.filter((c) => c === "A").length, cells.filter((c) => c === "L").length, marked ? `${Math.round((present / marked) * 100)}%` : ""];
    });
    const cls = classes.find((c) => c.id === classId);
    const csv = toCsv([
      [`${cls?.name ?? ""} ${sectionLabel(section)}, ${month}. P present, A absent, L leave, H holiday or Sunday, blank not marked.`],
      ["Roll ID", "Name", ...dates.map((d) => d.slice(8)), "Present", "Absent", "Leave", "Attendance"],
      ...rows,
    ]);
    downloadFile(`attendance-${(cls?.name ?? "class").replace(/\s+/g, "")}-${section.name}-${month}.csv`, csv);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            download();
          }}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>Monthly attendance sheet</DialogTitle>
            <DialogDescription>A spreadsheet with every school day of the month for one section. Opens in Excel.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField id="sheet-class" label="Class" options={classes.map((c) => ({ value: c.id, label: classLabel(c) }))} value={classId} onValueChange={(v) => { setClassId(v); setSectionId(""); }} />
            <SelectField id="sheet-section" label="Section" options={sections.map((s) => ({ value: s.id, label: sectionLabel(s) }))} value={section?.id ?? ""} onValueChange={setSectionId} />
            <TextField id="sheet-month" label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!section}>
              Download sheet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
