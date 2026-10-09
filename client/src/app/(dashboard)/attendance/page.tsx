"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  Lock,
  Unlock,
  Bell,
  Calendar,
  Send,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Users,
  Check,
  X,
  AlertCircle,
  FileText,
  Filter,
  Sparkles,
  Phone,
} from "lucide-react";

type AttendanceStatus = "P" | "A" | "L";

interface StudentAttendanceRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: AttendanceStatus;
  remark?: string;
  guardianPhone: string;
}

interface ClassLockRecord {
  id: string;
  className: string;
  section: string;
  teacher: string;
  totalStudents: number;
  present: number;
  absent: number;
  leave: number;
  status: "locked" | "pending";
  lockedAt?: string;
}

const initialStudents: StudentAttendanceRecord[] = [
  {
    id: "STD-1042",
    name: "Ahmed Khan",
    email: "ahmed.k@student.edu",
    avatar: "AK",
    status: "P",
    guardianPhone: "0300-1234567",
  },
  {
    id: "STD-1043",
    name: "Fatima Ali",
    email: "fatima.ali@student.edu",
    avatar: "FA",
    status: "A",
    remark: "Unannounced absence",
    guardianPhone: "0333-7654321",
  },
  {
    id: "STD-1044",
    name: "Muhammad Bilal",
    email: "m.bilal@student.edu",
    avatar: "MB",
    status: "P",
    guardianPhone: "0321-9876543",
  },
  {
    id: "STD-1045",
    name: "Ayesha Noor",
    email: "ayesha.n@student.edu",
    avatar: "AN",
    status: "P",
    guardianPhone: "0345-5544332",
  },
  {
    id: "STD-1046",
    name: "Zainab Tariq",
    email: "zainab.t@student.edu",
    avatar: "ZT",
    status: "L",
    remark: "Medical leave approved",
    guardianPhone: "0312-3322110",
  },
  {
    id: "STD-1047",
    name: "Hamza Farooq",
    email: "hamza.f@student.edu",
    avatar: "HF",
    status: "P",
    guardianPhone: "0301-4455667",
  },
  {
    id: "STD-1048",
    name: "Mariam Javed",
    email: "mariam.j@student.edu",
    avatar: "MJ",
    status: "P",
    guardianPhone: "0322-8877665",
  },
  {
    id: "STD-1049",
    name: "Usman Ghani",
    email: "usman.g@student.edu",
    avatar: "UG",
    status: "A",
    remark: "Sick - fever reported",
    guardianPhone: "0341-9988776",
  },
];

const initialClasses: ClassLockRecord[] = [
  {
    id: "CLS-9A",
    className: "Class 9",
    section: "Section A",
    teacher: "Sir Rashid Minhas",
    totalStudents: 36,
    present: 33,
    absent: 2,
    leave: 1,
    status: "locked",
    lockedAt: "08:45 AM by Principal",
  },
  {
    id: "CLS-9B",
    className: "Class 9",
    section: "Section B",
    teacher: "Ms. Saima Akram",
    totalStudents: 35,
    present: 31,
    absent: 3,
    leave: 1,
    status: "locked",
    lockedAt: "09:05 AM by Ms. Saima",
  },
  {
    id: "CLS-10A",
    className: "Class 10",
    section: "Section A",
    teacher: "Mr. Tariq Jamil",
    totalStudents: 38,
    present: 36,
    absent: 2,
    leave: 0,
    status: "locked",
    lockedAt: "08:50 AM by Mr. Tariq",
  },
  {
    id: "CLS-10B",
    className: "Class 10",
    section: "Section B",
    teacher: "Ms. Nida Parveen",
    totalStudents: 34,
    present: 29,
    absent: 4,
    leave: 1,
    status: "pending",
  },
  {
    id: "CLS-10C",
    className: "Class 10",
    section: "Section C",
    teacher: "Sir Asif Mehmood",
    totalStudents: 32,
    present: 30,
    absent: 1,
    leave: 1,
    status: "locked",
    lockedAt: "09:12 AM by Sir Asif",
  },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("mark");
  const [students, setStudents] = useState<StudentAttendanceRecord[]>(initialStudents);
  const [classes, setClasses] = useState<ClassLockRecord[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState("9");
  const [selectedSection, setSelectedSection] = useState("a");
  const [selectedDate, setSelectedDate] = useState("2026-10-09");
  const [searchQuery, setSearchQuery] = useState("");
  const [alertsSent, setAlertsSent] = useState(false);

  // Quick tally for Mark Attendance
  const presentCount = students.filter((s) => s.status === "P").length;
  const absentCount = students.filter((s) => s.status === "A").length;
  const leaveCount = students.filter((s) => s.status === "L").length;

  // Handler for student attendance segmented control
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleToggleLock = (classId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const isCurrentlyLocked = c.status === "locked";
          return {
            ...c,
            status: isCurrentlyLocked ? "pending" : "locked",
            lockedAt: isCurrentlyLocked ? undefined : "Just now by You",
          };
        }
        return c;
      })
    );
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const absentStudents = students.filter((s) => s.status === "A");

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER SECTION                                     */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Live Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Record classroom attendance, enforce administrative locks, and trigger instant guardian alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export Monthly Sheet
          </Button>
          <Button
            onClick={() => setActiveTab("review")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Lock Today's Attendance
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PILL-SHAPED SHADCN TABS                                */}
      {/* ========================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-4">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="mark"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Mark Attendance</span>
            </TabsTrigger>

            <TabsTrigger
              value="review"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Review & Lock</span>
              <span className="rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
                1 Pending
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="alerts"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Absence Alerts</span>
              {absentStudents.length > 0 && (
                <span className="rounded-full bg-rose-50 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700 border border-rose-200/60">
                  {absentStudents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: MARK ATTENDANCE                                    */}
        {/* ========================================================= */}
        <TabsContent value="mark" className="space-y-4 focus-visible:outline-none">
          {/* White Filter Bar Card */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Select Class */}
              <div className="w-[140px]">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Class
                </label>
                <Select
                  value={selectedClass}
                  onValueChange={(val) => {
                    if (val) setSelectedClass(val);
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select Section */}
              <div className="w-[140px]">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Section
                </label>
                <Select
                  value={selectedSection}
                  onValueChange={(val) => {
                    if (val) setSelectedSection(val);
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Section A</SelectItem>
                    <SelectItem value="b">Section B</SelectItem>
                    <SelectItem value="c">Section C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Picker */}
              <div className="w-[170px]">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 rounded-lg border-slate-200 text-xs text-slate-700 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Search in Class */}
              <div className="min-w-[200px] flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Filter Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or roll..."
                    className="h-9 pl-9 text-xs border-slate-200 bg-slate-50/60 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 self-end lg:self-center pt-2 lg:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("P")}
                className="h-8 border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold shadow-xs"
              >
                Mark All Present
              </Button>
            </div>
          </div>

          {/* Quick Real-Time Roster Tally Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Present
                </span>
                <span className="text-2xl font-bold text-emerald-800">
                  {presentCount}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-200">
                P
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                  Absent
                </span>
                <span className="text-2xl font-bold text-rose-800">
                  {absentCount}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs ring-1 ring-rose-200">
                A
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  On Leave
                </span>
                <span className="text-2xl font-bold text-amber-800">
                  {leaveCount}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs ring-1 ring-amber-200">
                L
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] py-3.5 pl-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Roll / ID
                  </TableHead>
                  <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Student Details
                  </TableHead>
                  <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Remarks / Reason
                  </TableHead>
                  <TableHead className="w-[200px] py-3.5 pr-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Attendance Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Roll / ID */}
                    <TableCell className="py-3.5 pl-5">
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                        {student.id}
                      </span>
                    </TableCell>

                    {/* Avatar + Name + Email */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/10">
                          {student.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm">
                            {student.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Remarks / Reason */}
                    <TableCell className="py-3.5">
                      <span className="text-xs text-slate-500 italic">
                        {student.remark || "— Regular"}
                      </span>
                    </TableCell>

                    {/* Status Column: Custom Segmented Control */}
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-xs">
                        {/* P - Present */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "P")}
                          className={`flex h-7 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                            student.status === "P"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                          title="Mark Present"
                        >
                          P
                        </button>

                        {/* A - Absent */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "A")}
                          className={`flex h-7 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                            student.status === "A"
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>

                        {/* L - Leave */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "L")}
                          className={`flex h-7 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                            student.status === "L"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                          title="Mark Leave"
                        >
                          L
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Bottom Footer Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 bg-slate-50/50 px-5 py-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All changes auto-saved to cloud draft.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-200 bg-white text-xs text-slate-700 shadow-xs"
                >
                  Reset Changes
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Submit & Sync Roster
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: REVIEW & LOCK                                      */}
        {/* ========================================================= */}
        <TabsContent value="review" className="space-y-4 focus-visible:outline-none">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Classes Reconciled
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {classes.filter((c) => c.status === "locked").length} / {classes.length}
                </span>
                <span className="text-xs font-medium text-emerald-600">80% Locked</span>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Present Today
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">159</span>
                <span className="text-xs font-medium text-slate-500">of 175 Enrolled</span>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Overall Attendance
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-700">90.8%</span>
                <span className="text-xs font-medium text-emerald-600">+1.2% vs yesterday</span>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Lock Window Deadline
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">01:30 PM</span>
                <span className="text-xs font-medium text-amber-600">Closes in 45m</span>
              </div>
            </Card>
          </div>

          {/* Classes Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Classroom Verification Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Review class counts and lock entries to prevent unauthorized post-day modifications.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs h-8"
                onClick={() =>
                  setClasses((prev) =>
                    prev.map((c) => ({ ...c, status: "locked", lockedAt: "Now by Admin" }))
                  )
                }
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Lock All Remaining Classes
              </Button>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3.5 pl-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Class & Section
                  </TableHead>
                  <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Assigned Teacher
                  </TableHead>
                  <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total
                  </TableHead>
                  <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Present
                  </TableHead>
                  <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Absent
                  </TableHead>
                  <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Leave
                  </TableHead>
                  <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Lock Status
                  </TableHead>
                  <TableHead className="py-3.5 pr-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {classes.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Class & Section */}
                    <TableCell className="py-4 pl-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">
                          {cls.className} - {cls.section}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {cls.id}
                        </span>
                      </div>
                    </TableCell>

                    {/* Teacher */}
                    <TableCell className="py-4">
                      <span className="text-xs font-medium text-slate-700">
                        {cls.teacher}
                      </span>
                    </TableCell>

                    {/* Total */}
                    <TableCell className="py-4 text-center">
                      <span className="text-xs font-semibold text-slate-800">
                        {cls.totalStudents}
                      </span>
                    </TableCell>

                    {/* Present */}
                    <TableCell className="py-4 text-center">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {cls.present}
                      </span>
                    </TableCell>

                    {/* Absent */}
                    <TableCell className="py-4 text-center">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        {cls.absent}
                      </span>
                    </TableCell>

                    {/* Leave */}
                    <TableCell className="py-4 text-center">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        {cls.leave}
                      </span>
                    </TableCell>

                    {/* Status Badge (Dot-Style) */}
                    <TableCell className="py-4">
                      {cls.status === "locked" ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Locked
                          </span>
                          {cls.lockedAt && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {cls.lockedAt}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 w-fit">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Lock
                        </span>
                      )}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="py-4 pr-5 text-right">
                      {cls.status === "locked" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLock(cls.id)}
                          className="h-8 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Unlock className="mr-1 h-3.5 w-3.5" />
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleToggleLock(cls.id)}
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs"
                        >
                          <Lock className="mr-1 h-3.5 w-3.5" />
                          Lock Class
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: ABSENCE ALERTS                                     */}
        {/* ========================================================= */}
        <TabsContent value="alerts" className="space-y-6 focus-visible:outline-none">
          {/* Clean Alert Overview Card */}
          <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {absentStudents.length} Students Absent Today
                    </h2>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
                      Unexcused
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 max-w-xl leading-relaxed">
                    Automated SMS and WhatsApp gateways are connected. Dispatching alerts will send a personalized notification directly to each student's registered guardian phone number.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => setAlertsSent(true)}
                  disabled={alertsSent || absentStudents.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs h-10 px-5 text-xs font-semibold"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {alertsSent ? "Alerts Successfully Dispatched" : "Send Bulk WhatsApp Alerts"}
                </Button>
              </div>
            </div>

            {alertsSent && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Dispatched {absentStudents.length} WhatsApp notifications via Cloud API gateway at{" "}
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Delivery receipts logged in Audit Trail.
                </span>
              </div>
            )}
          </Card>

          {/* WhatsApp Template Preview & Absentee Roster Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Template Preview Card (1 Column) */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  WhatsApp Template Preview
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Pre-configured transactional message template.
                </CardDescription>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-200/80 bg-[#e7f8ef] p-4 text-xs text-slate-800 shadow-xs relative">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                    <span>EduCore ERP • Attendance Notice</span>
                  </div>
                  <p className="leading-relaxed">
                    "Respected Parent, your child{" "}
                    <span className="font-semibold text-emerald-900 bg-emerald-100/80 px-1 rounded">
                      [Student Name]
                    </span>{" "}
                    (Class 9-A) has been marked{" "}
                    <span className="font-bold text-rose-700">ABSENT</span> on{" "}
                    <span className="font-medium">09-Oct-2026</span> without prior written notice.
                  </p>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Please contact the branch administration immediately if this absence is in error."
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-emerald-200/60">
                    <span>Sender: EduCore High</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Check className="h-3 w-3" /> WhatsApp Verified
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200/70">
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    Delivery Rules
                  </span>
                  SMS fallback is enabled automatically if the recipient’s WhatsApp number is unreachable.
                </div>
              </div>
            </Card>

            {/* Absentee Student List (2 Columns) */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Today's Absentee List ({absentStudents.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Individual contact records targeted for notification dispatch.
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  Class 9 & 10
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {absentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/10">
                        {student.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {student.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {student.id}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {student.remark || "No reason logged"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono">{student.guardianPhone}</span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          alertsSent
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {alertsSent ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" /> Sent
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-slate-400" /> Pending
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
