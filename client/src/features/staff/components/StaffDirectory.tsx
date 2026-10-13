"use client";

import { useState } from "react";
import {
  Card,
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
  UserX,
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { statusVariant } from "@/lib/status";
import { StaffMember } from "../types";

const departmentOptions = [
  { value: "all", label: "All departments" },
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "it-&-cs", label: "IT & CS" },
  { value: "humanities", label: "Humanities" },
  { value: "sports", label: "Sports" },
];

const staffStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Left" },
];

const staffStatusLabels: Record<StaffMember["status"], string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Left",
};

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

  const departments = [...new Set(mockStaff.map((s) => s.department))];
  const isFiltered = searchQuery !== "" || selectedDept !== "all" || selectedStatus !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDept("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Staff members" value={mockStaff.length} footer={`Across ${departments.length} departments`} />
        <StatCard label="Active" value={activeStaffCount} footer="On the roster today" />
        <StatCard label="On leave" value={onLeaveCount} footer="Approved medical or casual leave" />
        <StatCard label="Departments" value={departments.length} footer={departments.join(", ")} />
      </div>

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Staff directory</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Teaching and administrative staff at this campus.</p>
            </div>
            <Button variant="outline">
              <Download data-icon="inline-start" />
              Export directory
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search staff"
                placeholder="Name, staff ID, role or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-card pl-9"
              />
            </div>
            <div className="sm:col-span-3">
              <Select items={departmentOptions} value={selectedDept} onValueChange={(val) => val && setSelectedDept(val)}>
                <SelectTrigger aria-label="Filter by department" className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-3">
              <Select items={staffStatusOptions} value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
                <SelectTrigger aria-label="Filter by status" className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffStatusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="No staff match these filters"
            description="Try a different name or staff ID, or clear the filters."
            action={
              isFiltered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden pl-5 md:table-cell">Staff ID</TableHead>
                <TableHead className="pl-5 md:pl-3">Name</TableHead>
                <TableHead className="hidden xl:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead className="hidden 2xl:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden pr-5 text-right xl:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="hidden pl-5 text-muted-foreground md:table-cell">{staff.staffId}</TableCell>
                  <TableCell className="min-w-44 pl-5 whitespace-normal md:pl-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground sm:flex"
                      >
                        {staff.avatar}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{staff.name}</p>
                        <p className="flex items-center gap-1 text-xs break-all text-muted-foreground">
                          <Mail aria-hidden className="size-3 shrink-0" />
                          {staff.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{staff.role}</TableCell>
                  <TableCell className="hidden lg:table-cell">{staff.department}</TableCell>
                  <TableCell className="hidden 2xl:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone aria-hidden className="size-3" />
                      {staff.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(staff.status)}>{staffStatusLabels[staff.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden pr-5 text-right text-muted-foreground xl:table-cell">{staff.joinDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-border bg-muted/50 px-5 py-3 text-sm text-muted-foreground sm:px-6">
          Showing {filteredStaff.length} of {mockStaff.length} staff members
        </div>
      </Card>
    </div>
  );
}
