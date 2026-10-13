"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { sectionLabel, useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useGetAllocationsQuery, useGetSectionsQuery, useGetSubjectsQuery, useGetTeachersQuery } from "@/store/api";
import { TeacherAllocation } from "../types";

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

export function TeacherAllocations() {
  const readOnly = useReadOnly();
  const { data: initialAllocations = [] } = useGetAllocationsQuery();
  const { data: availableTeachers = [] } = useGetTeachersQuery();
  const { data: availableSubjects = [] } = useGetSubjectsQuery();
  const teacherOptions = availableTeachers.map((t) => ({ value: t.id, label: t.name }));
  const subjectOptions = toOptions(availableSubjects.map((s) => s.name));
  const branchClasses = useBranchClasses();
  const { data: allSections = [] } = useGetSectionsQuery();
  const classOptions = toOptions(branchClasses.map((c) => c.name));
  const [allocations, setAllocations] = useState<TeacherAllocation[]>(initialAllocations);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("Section A");
  // Sections of the chosen class, or every section letter at this campus before a class is chosen.
  const chosenClass = branchClasses.find((c) => c.name === selectedClass);
  const sectionNames = [
    ...new Set(
      allSections
        .filter((s) => (chosenClass ? s.classId === chosenClass.id : branchClasses.some((c) => c.id === s.classId)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => sectionLabel(s))
    ),
  ];
  const sectionOptions = toOptions(sectionNames);
  const section = sectionNames.includes(selectedSection) ? selectedSection : (sectionNames[0] ?? "");
  const [successNotice, setSuccessNotice] = useState(false);

  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubject || !selectedClass || !section) return;

    const teacher = availableTeachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const newAllocation: TeacherAllocation = {
      id: `alc-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      avatar: teacher.avatar,
      subject: selectedSubject,
      className: selectedClass,
      section,
      weeklyPeriods: 5,
      roomNumber: "Room 105",
    };

    setAllocations([newAllocation, ...allocations]);
    setSelectedTeacherId("");
    setSelectedSubject("");
    setSelectedClass("");
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 4000);
  };

  const handleDeleteAllocation = (id: string) => {
    setAllocations(allocations.filter((a) => a.id !== id));
  };

  const fields = [
    { id: "alloc-teacher", label: "Teacher", items: teacherOptions, value: selectedTeacherId, set: setSelectedTeacherId, placeholder: "Choose a teacher" },
    { id: "alloc-subject", label: "Subject", items: subjectOptions, value: selectedSubject, set: setSelectedSubject, placeholder: "Choose a subject" },
    { id: "alloc-class", label: "Class", items: classOptions, value: selectedClass, set: setSelectedClass, placeholder: "Choose a class" },
    { id: "alloc-section", label: "Section", items: sectionOptions, value: section, set: setSelectedSection, placeholder: "Choose a section" },
  ];

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Assign a subject</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            Choose who teaches which subject to which class this term.
          </CardDescription>
        </div>

        <form onSubmit={handleAddAllocation} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium">
                  {f.label}
                </label>
                <Select items={f.items} value={f.value} onValueChange={(val) => val && f.set(val)}>
                  <SelectTrigger id={f.id} className="h-9 w-full bg-card">
                    <SelectValue placeholder={f.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.items.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" role="status">
              {successNotice ? (
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 aria-hidden className="size-4" />
                  Allocation added.
                </span>
              ) : (
                `${allocations.length} allocations this term`
              )}
            </p>
            <Button type="submit" disabled={readOnly || !selectedTeacherId || !selectedSubject || !selectedClass}>
              <Plus data-icon="inline-start" />
              Assign subject
            </Button>
          </div>
        </form>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Current allocations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Teaching load by teacher, subject and class.</p>
        </div>

        {allocations.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No allocations yet"
            description="Use the form above to assign a subject to a teacher."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Class</TableHead>
                <TableHead className="hidden lg:table-cell">Room</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Periods a week</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {allocations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-5">
                    <p className="font-medium">{item.teacherName}</p>
                    <p className="text-xs text-muted-foreground">{item.teacherId}</p>
                  </TableCell>
                  <TableCell>
                    <p>{item.subject}</p>
                    <p className="text-xs text-muted-foreground lg:hidden">
                      {item.className}, {item.section}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {item.className}, {item.section}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{item.roomNumber}</TableCell>
                  <TableCell className="hidden text-right lg:table-cell">{item.weeklyPeriods}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteAllocation(item.id)}
                      disabled={readOnly}
                      aria-label={`Remove ${item.subject} for ${item.className}, ${item.section} from ${item.teacherName}`}
                      className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
