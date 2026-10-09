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
import { Student } from "../types";
import { StudentProfileDrawer } from "./StudentProfileDrawer";

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

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Filters Bar Card */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[240px] flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll ID, or phone..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 text-xs transition-colors focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Class Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-[130px] rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="9">Class 9</SelectItem>
              <SelectItem value="10">Class 10</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select defaultValue="all-status">
            <SelectTrigger className="h-9 w-[130px] rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="defaulter">Defaulter</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing {filteredStudents.length} of 1,245 records</span>
        </div>
      </div>

      {/* Upgraded Data Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] py-3.5 pl-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Roll / ID
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Student Name
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Class & Section
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Guardian & Contact
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Attendance
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-[80px] py-3.5 pr-5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <TableRow
                key={student.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => handleRowClick(student)}
              >
                {/* Roll / ID */}
                <TableCell className="py-4 pl-5">
                  <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                    {student.id}
                  </span>
                </TableCell>

                {/* Student Name & Avatar */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/10">
                      {student.avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {student.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {student.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Class & Section */}
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">
                      {student.class}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {student.section}
                    </span>
                  </div>
                </TableCell>

                {/* Guardian & Phone */}
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-800">
                      {student.guardian}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {student.phone}
                    </span>
                  </div>
                </TableCell>

                {/* Attendance */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          parseInt(student.attendance) >= 90
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: student.attendance }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {student.attendance}
                    </span>
                  </div>
                </TableCell>

                {/* Status Badge */}
                <TableCell className="py-4">
                  <DirectoryStatusBadge status={student.status} />
                </TableCell>

                {/* Actions Menu */}
                <TableCell
                  className="py-4 pr-5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                        Options for {student.id}
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer text-xs font-medium"
                        onClick={() => handleRowClick(student)}
                      >
                        <Users className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        View Full Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium">
                        <CreditCard className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        Issue Fee Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium">
                        <MessageSquare className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        WhatsApp Guardian
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium text-rose-600 focus:text-rose-600">
                        <ShieldAlert className="mr-2 h-3.5 w-3.5 text-rose-600" />
                        Deactivate / Mark Left
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination & Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-5 py-3">
          <span className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-800">1</span> of{" "}
            <span className="font-semibold text-slate-800">25</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 border-slate-200 bg-white text-xs shadow-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 bg-white text-xs hover:bg-slate-50 shadow-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-out Student Profile Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

function DirectoryStatusBadge({
  status,
}: {
  status: Student["status"];
}) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }

  if (status === "defaulter") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Defaulter
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending Fee
    </span>
  );
}

