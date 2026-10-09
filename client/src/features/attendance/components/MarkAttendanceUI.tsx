"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2 } from "lucide-react";
import { AttendanceStatus, StudentAttendanceRecord } from "../types";

const defaultStudents: StudentAttendanceRecord[] = [
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

interface MarkAttendanceUIProps {
  initialRecords?: StudentAttendanceRecord[];
  onRosterUpdate?: (records: StudentAttendanceRecord[]) => void;
}

export function MarkAttendanceUI({
  initialRecords = defaultStudents,
  onRosterUpdate,
}: MarkAttendanceUIProps) {
  const [students, setStudents] = useState<StudentAttendanceRecord[]>(initialRecords);
  const [selectedClass, setSelectedClass] = useState("9");
  const [selectedSection, setSelectedSection] = useState("a");
  const [selectedDate, setSelectedDate] = useState("2026-10-09");
  const [searchQuery, setSearchQuery] = useState("");

  const presentCount = students.filter((s) => s.status === "P").length;
  const absentCount = students.filter((s) => s.status === "A").length;
  const leaveCount = students.filter((s) => s.status === "L").length;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const updated = students.map((s) =>
      s.id === studentId ? { ...s, status } : s
    );
    setStudents(updated);
    onRosterUpdate?.(updated);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = students.map((s) => ({ ...s, status }));
    setStudents(updated);
    onRosterUpdate?.(updated);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 1. White Filter Bar Card */}
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
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-lg border-slate-200 text-xs text-slate-700 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
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

      {/* 2. Real-Time Roster Tally Cards */}
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

      {/* 3. Data Table with [P] [A] [L] Segmented Controls */}
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

                {/* Segmented Control [ P ] [ A ] [ L ] */}
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

        {/* Footer Bar */}
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
    </div>
  );
}

