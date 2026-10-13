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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  Users,
  Phone,
  ShieldAlert,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { statusVariant } from "@/lib/status";
import { studentStatusLabels } from "../status";
import { Student } from "../types";
import { StudentProfileDrawer } from "./StudentProfileDrawer";

const classOptions = [
  { value: "all", label: "All classes" },
  { value: "Class 9", label: "Class 9" },
  { value: "Class 10", label: "Class 10" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "defaulter", label: "Defaulter" },
  { value: "pending", label: "Fee pending" },
];

const mockStudents: Student[] = [
  {
    id: "STD-1042",
    name: "Ahmed Khan",
    email: "ahmed.k@student.edu",
    avatar: "AK",
    class: "Class 9",
    section: "Section A",
    guardian: "Muhammad Khan",
    phone: "0300-1234567",
    status: "active",
    attendance: "94%",
    balance: "Rs 0",
  },
  {
    id: "STD-1043",
    name: "Fatima Ali",
    email: "fatima.ali@student.edu",
    avatar: "FA",
    class: "Class 10",
    section: "Section B",
    guardian: "Ali Asghar",
    phone: "0333-7654321",
    status: "defaulter",
    attendance: "88%",
    balance: "Rs 6,000",
  },
  {
    id: "STD-1044",
    name: "Muhammad Bilal",
    email: "m.bilal@student.edu",
    avatar: "MB",
    class: "Class 9",
    section: "Section A",
    guardian: "Bilal Tariq",
    phone: "0321-9876543",
    status: "active",
    attendance: "98%",
    balance: "Rs 0",
  },
  {
    id: "STD-1045",
    name: "Ayesha Noor",
    email: "ayesha.n@student.edu",
    avatar: "AN",
    class: "Class 10",
    section: "Section A",
    guardian: "Noor Hassan",
    phone: "0345-5544332",
    status: "active",
    attendance: "91%",
    balance: "Rs 0",
  },
  {
    id: "STD-1046",
    name: "Zainab Tariq",
    email: "zainab.t@student.edu",
    avatar: "ZT",
    class: "Class 9",
    section: "Section C",
    guardian: "Tariq Mehmood",
    phone: "0312-3322110",
    status: "pending",
    attendance: "82%",
    balance: "Rs 3,000",
  },
];

export function StudentDirectory() {
  const [students] = useState<Student[]>(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    mockStudents[0]
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const openProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setClassFilter("all");
    setStatusFilter("all");
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter(
    (student) =>
      (classFilter === "all" || student.class === classFilter) &&
      (statusFilter === "all" || student.status === statusFilter) &&
      (!query ||
        student.name.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query) ||
        student.phone.includes(query))
  );
  const isFiltered = query !== "" || classFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1 lg:max-w-md">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll ID or phone"
              aria-label="Search students"
              className="h-9 bg-card pl-9"
            />
          </div>

          <Select items={classOptions} value={classFilter} onValueChange={(v) => setClassFilter(v ?? "all")}>
            <SelectTrigger aria-label="Filter by class" className="h-9 w-36 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select items={statusOptions} value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger aria-label="Filter by status" className="h-9 w-36 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students match these filters"
            description="Try a different name or roll ID, or clear the filters to see everyone."
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
                <TableHead className="hidden pl-5 lg:table-cell">Roll ID</TableHead>
                <TableHead className="pl-5 lg:pl-3">Student</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
                <TableHead className="hidden xl:table-cell">Guardian</TableHead>
                <TableHead className="hidden xl:table-cell">Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="group cursor-pointer"
                  onClick={() => openProfile(student)}
                >
                  <TableCell className="hidden pl-5 text-muted-foreground lg:table-cell">{student.id}</TableCell>

                  <TableCell className="pl-5 lg:pl-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="hidden size-9 shrink-0 sm:flex items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                      >
                        {student.avatar}
                      </span>
                      <div className="flex flex-col">
                        {/* The name is the keyboard entry point to the profile. */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProfile(student);
                          }}
                          className="w-fit rounded text-left font-medium text-foreground outline-none group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {student.name}
                        </button>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span>{student.class}</span>
                      <span className="text-xs text-muted-foreground">{student.section}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-col">
                      <span>{student.guardian}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone aria-hidden className="size-3" />
                        {student.phone}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            parseInt(student.attendance) >= 90 ? "bg-success" : "bg-warning"
                          }`}
                          style={{ width: student.attendance }}
                        />
                      </div>
                      <span className="font-medium">{student.attendance}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(student.status)}>{studentStatusLabels[student.status]}</Badge>
                  </TableCell>

                  <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${student.name}`}>
                            <MoreVertical />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{student.id}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openProfile(student)}>
                            <Users className="text-muted-foreground" />
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="text-muted-foreground" />
                            Issue fee voucher
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="text-muted-foreground" />
                            Message guardian on WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                          <ShieldAlert />
                          Mark as left
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <StudentProfileDrawer
        student={selectedStudent}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
