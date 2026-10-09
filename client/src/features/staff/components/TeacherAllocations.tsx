"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
  BookOpen,
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  Clock,
  Layers,
} from "lucide-react";
import { TeacherAllocation } from "../types";

const initialAllocations: TeacherAllocation[] = [
  {
    id: "alc-1",
    teacherId: "STF-201",
    teacherName: "Dr. Tariq Mahmood",
    avatar: "TM",
    subject: "Physics",
    className: "Class 10",
    section: "Section A",
    weeklyPeriods: 6,
    roomNumber: "Lab 02",
  },
  {
    id: "alc-2",
    teacherId: "STF-201",
    teacherName: "Dr. Tariq Mahmood",
    avatar: "TM",
    subject: "Physics",
    className: "Class 9",
    section: "Section B",
    weeklyPeriods: 5,
    roomNumber: "Room 104",
  },
  {
    id: "alc-3",
    teacherId: "STF-202",
    teacherName: "Saima Nazir",
    avatar: "SN",
    subject: "Mathematics",
    className: "Class 10",
    section: "Section A",
    weeklyPeriods: 7,
    roomNumber: "Room 201",
  },
  {
    id: "alc-4",
    teacherId: "STF-204",
    teacherName: "Ayesha Siddiqua",
    avatar: "AS",
    subject: "English Literature",
    className: "Class 8",
    section: "Section C",
    weeklyPeriods: 5,
    roomNumber: "Room 108",
  },
  {
    id: "alc-5",
    teacherId: "STF-205",
    teacherName: "Kamran Akram",
    avatar: "KA",
    subject: "Computer Science",
    className: "Class 9",
    section: "Section A",
    weeklyPeriods: 6,
    roomNumber: "CS Lab 01",
  },
];

const availableTeachers = [
  { id: "STF-201", name: "Dr. Tariq Mahmood", avatar: "TM" },
  { id: "STF-202", name: "Saima Nazir", avatar: "SN" },
  { id: "STF-203", name: "Rashid Minhas", avatar: "RM" },
  { id: "STF-204", name: "Ayesha Siddiqua", avatar: "AS" },
  { id: "STF-205", name: "Kamran Akram", avatar: "KA" },
];

const availableSubjects = [
  "Physics",
  "Mathematics",
  "Chemistry",
  "Biology",
  "English Literature",
  "Computer Science",
  "Urdu",
  "Pakistan Studies",
];

const availableClasses = ["Class 8", "Class 9", "Class 10"];
const availableSections = ["Section A", "Section B", "Section C"];

export function TeacherAllocations() {
  const [allocations, setAllocations] = useState<TeacherAllocation[]>(
    initialAllocations
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("Section A");
  const [successNotice, setSuccessNotice] = useState(false);

  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubject || !selectedClass) return;

    const teacher = availableTeachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const newAllocation: TeacherAllocation = {
      id: `alc-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      avatar: teacher.avatar,
      subject: selectedSubject,
      className: selectedClass,
      section: selectedSection,
      weeklyPeriods: 5,
      roomNumber: "Room 105",
    };

    setAllocations([newAllocation, ...allocations]);
    setSelectedTeacherId("");
    setSelectedSubject("");
    setSelectedClass("");
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3500);
  };

  const handleDeleteAllocation = (id: string) => {
    setAllocations(allocations.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Allocation Assignment Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                Course & Classroom Allocation
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Assign educators to subject curricula, target classes, and sections for the academic term.
              </CardDescription>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleAddAllocation} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Select Teacher */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select Teacher
                </label>
                <Select
                  value={selectedTeacherId}
                  onValueChange={(val) => {
                    if (val) setSelectedTeacherId(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Choose educator..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    {availableTeachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Subject */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select Subject
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={(val) => {
                    if (val) setSelectedSubject(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Choose subject..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    {availableSubjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Class */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Target Class
                </label>
                <Select
                  value={selectedClass}
                  onValueChange={(val) => {
                    if (val) setSelectedClass(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Choose class..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Section */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Section
                </label>
                <Select
                  value={selectedSection}
                  onValueChange={(val) => {
                    if (val) setSelectedSection(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Choose section..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    {availableSections.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              {successNotice ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Allocation recorded and timetable sync scheduled!</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Total Active Roster:{" "}
                  <span className="font-semibold text-slate-700">
                    {allocations.length} course mappings
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedTeacherId || !selectedSubject || !selectedClass}
                className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors rounded-lg ml-auto"
              >
                <Plus className="h-4 w-4" />
                Assign Course
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Table: Active Assignments */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                Active Course Assignments
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Overview of current faculty teaching loads and classroom assignments.
              </CardDescription>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
              {allocations.length} Allocations
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Teacher Name & ID
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned Subject
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Grade / Section
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Room / Facility
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Weekly Periods
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {allocations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-slate-500"
                    >
                      <Layers className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        No active allocations found
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Use the allocation form above to assign subjects to teachers.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Teacher */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                            {item.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 leading-tight">
                              {item.teacherName}
                            </div>
                            <div className="text-xs font-mono text-slate-500 mt-0.5">
                              {item.teacherId}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Subject */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-800">
                            {item.subject}
                          </span>
                        </div>
                      </TableCell>

                      {/* Grade & Section */}
                      <TableCell className="py-4 px-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
                          {item.className} • {item.section}
                        </span>
                      </TableCell>

                      {/* Room */}
                      <TableCell className="py-4 px-4 text-xs font-medium text-slate-600">
                        {item.roomNumber}
                      </TableCell>

                      {/* Weekly Periods */}
                      <TableCell className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {item.weeklyPeriods} hrs/wk
                        </span>
                      </TableCell>

                      {/* Remove Button */}
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAllocation(item.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

