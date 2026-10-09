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
  Search,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Download,
  UserPlus,
  Calendar,
  Building,
} from "lucide-react";
import { StaffMember } from "../types";

const mockStaff: StaffMember[] = [
  {
    id: "st-1",
    staffId: "STF-201",
    name: "Dr. Tariq Mahmood",
    avatar: "TM",
    email: "tariq.mahmood@school.edu.pk",
    role: "Senior Physics Lecturer",
    department: "Science",
    phone: "+92 300 1122334",
    joinDate: "Aug 15, 2021",
    status: "active",
  },
  {
    id: "st-2",
    staffId: "STF-202",
    name: "Saima Nazir",
    avatar: "SN",
    email: "saima.nazir@school.edu.pk",
    role: "Head of Mathematics",
    department: "Mathematics",
    phone: "+92 321 9988776",
    joinDate: "Jan 10, 2019",
    status: "active",
  },
  {
    id: "st-3",
    staffId: "STF-203",
    name: "Rashid Minhas",
    avatar: "RM",
    email: "rashid.minhas@school.edu.pk",
    role: "Chemistry Teacher",
    department: "Science",
    phone: "+92 333 4455667",
    joinDate: "Sep 01, 2022",
    status: "on_leave",
  },
  {
    id: "st-4",
    staffId: "STF-204",
    name: "Ayesha Siddiqua",
    avatar: "AS",
    email: "ayesha.s@school.edu.pk",
    role: "English Literature Instructor",
    department: "Humanities",
    phone: "+92 312 8899001",
    joinDate: "Mar 12, 2023",
    status: "active",
  },
  {
    id: "st-5",
    staffId: "STF-205",
    name: "Kamran Akram",
    avatar: "KA",
    email: "kamran.akram@school.edu.pk",
    role: "Computer Science Teacher",
    department: "IT & CS",
    phone: "+92 345 6677889",
    joinDate: "Oct 05, 2020",
    status: "active",
  },
  {
    id: "st-6",
    staffId: "STF-206",
    name: "Farhan Ali",
    avatar: "FA",
    email: "farhan.ali@school.edu.pk",
    role: "Physical Education Coach",
    department: "Sports",
    phone: "+92 301 2233445",
    joinDate: "Feb 01, 2024",
    status: "terminated",
  },
];

export function StaffDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredStaff = mockStaff.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery);

    const matchesDept =
      selectedDept === "all" ||
      staff.department.toLowerCase().replace(/\s+/g, "-") === selectedDept;

    const matchesStatus =
      selectedStatus === "all" || staff.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeStaffCount = mockStaff.filter((s) => s.status === "active").length;
  const onLeaveCount = mockStaff.filter((s) => s.status === "on_leave").length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Faculty
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {mockStaff.length}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Across 5 academic departments
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Duty
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              {activeStaffCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Present on roster today
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              On Leave
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/70">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-amber-600">
              {onLeaveCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Approved medical or casual leave
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Departments
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              5
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Science, Math, CS, Humanities, Sports
            </p>
          </div>
        </Card>
      </div>

      {/* Main Staff Registry Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Staff Directory
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  {filteredStaff.length} Members
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Manage teaching faculty, administrative employees, and departmental allocations.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Export Directory
              </Button>

              <Button
                size="sm"
                className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add New Staff
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search staff by name, ID, designation, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedDept}
                onValueChange={(val) => {
                  if (val) setSelectedDept(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="it-&-cs">IT & CS</SelectItem>
                  <SelectItem value="humanities">Humanities</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  if (val) setSelectedStatus(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Staff ID
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Faculty Name & Details
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Role & Designation
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Phone & Contact
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Joined Date
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <UserX className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        No faculty members found
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try modifying your search or filter options.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow
                      key={staff.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Staff ID */}
                      <TableCell className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                        {staff.staffId}
                      </TableCell>

                      {/* Name & Avatar */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                            {staff.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 leading-tight">
                              {staff.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-800">
                          {staff.role}
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell className="py-4 px-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/80">
                          {staff.department}
                        </span>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {staff.phone}
                        </div>
                      </TableCell>

                      {/* Dot-style Status Badges */}
                      <TableCell className="py-4 px-4 text-center">
                        {staff.status === "active" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                        {staff.status === "on_leave" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            On Leave
                          </span>
                        )}
                        {staff.status === "terminated" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="py-4 px-4 text-right text-xs text-slate-500">
                        {staff.joinDate}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer info */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredStaff.length}
              </span>{" "}
              of {mockStaff.length} registered faculty members
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>Active Attendance Ratio:</span>
              <span className="font-semibold text-emerald-600">
                {Math.round((activeStaffCount / mockStaff.length) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

