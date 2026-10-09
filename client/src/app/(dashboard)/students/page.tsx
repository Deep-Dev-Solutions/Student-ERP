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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  UploadCloud,
  MoreVertical,
  FileDown,
  PlusCircle,
  Users,
  UserPlus,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Building,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  Check,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  CreditCard,
  History,
  Info,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  class: string;
  section: string;
  guardian: string;
  phone: string;
  status: "active" | "defaulter" | "pending";
  attendance: string;
  balance: string;
}

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

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    mockStudents[0]
  );
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. HEADER SECTION                                         */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Admit, monitor, and manage student directories and academic profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <FileDown className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </Button>
          <Button
            onClick={() => setActiveTab("admission")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            New Admission
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MODERN PILL-SHAPED TABS                                */}
      {/* ========================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-4">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="directory"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Student Directory</span>
              <span className="rounded-full bg-slate-200/70 data-active:bg-blue-50 data-active:text-blue-700 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                1,245
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="admission"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Admission Form</span>
            </TabsTrigger>

            <TabsTrigger
              value="import"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Bulk Excel Import</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: STUDENT DIRECTORY                                  */}
        {/* ========================================================= */}
        <TabsContent value="directory" className="space-y-4 focus-visible:outline-none">
          {/* Filters Bar Card */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative min-w-[240px] flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
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
              <span>Showing 5 of 1,245 records</span>
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
                {mockStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedStudent(student)}
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

                    {/* Status Badge (Pure font color on soft bg with no bulky border) */}
                    <TableCell className="py-4">
                      <StatusBadge status={student.status} />
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell
                      className="py-4 pr-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StudentActionsMenu student={student} />
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
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: ADMISSION FORM (STRUCTURED CARDS WITH STEPPING)     */}
        {/* ========================================================= */}
        <TabsContent value="admission" className="focus-visible:outline-none">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Step 1: Student Personal Information */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs ring-1 ring-blue-500/10">
                  01
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Step 1: Student Information
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Basic demographic, official legal name, and biological details.
                  </CardDescription>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Ahmed"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Khan"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <Select defaultValue="male">
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Blood Group
                  </label>
                  <Select defaultValue="b_pos">
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_pos">A+</SelectItem>
                      <SelectItem value="b_pos">B+</SelectItem>
                      <SelectItem value="o_pos">O+</SelectItem>
                      <SelectItem value="ab_pos">AB+</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Previous School
                  </label>
                  <Input
                    placeholder="e.g. City Grammar School"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Card>

            {/* Step 2: Guardian Details */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs ring-1 ring-indigo-500/10">
                  02
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Step 2: Guardian & Emergency Contacts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Parental identification and automated WhatsApp fee/attendance notification channel.
                  </CardDescription>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Father / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Muhammad Raza Khan"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Guardian CNIC / National ID
                  </label>
                  <Input
                    placeholder="35201-XXXXXXX-X"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    WhatsApp Alert Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="0300-XXXXXXX"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Automated attendance notifications will be sent to this WhatsApp.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Secondary Phone
                  </label>
                  <Input
                    placeholder="0321-XXXXXXX"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Card>

            {/* Step 3: Academic Assignment & Fee Structure */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs ring-1 ring-emerald-500/10">
                  03
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Step 3: Academic Assignment & Fee Structure
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Grade placement, section allocation, and monthly tuition dues.
                  </CardDescription>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Enrolling Class <span className="text-rose-500">*</span>
                  </label>
                  <Select defaultValue="9">
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Class 9 (Matric)</SelectItem>
                      <SelectItem value="10">Class 10 (Matric)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Section Allocation <span className="text-rose-500">*</span>
                  </label>
                  <Select defaultValue="a">
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Section A (Morning)</SelectItem>
                      <SelectItem value="b">Section B (Morning)</SelectItem>
                      <SelectItem value="c">Section C (Evening)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Monthly Tuition Fee (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    defaultValue="3000"
                    placeholder="3,000"
                    className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-10 px-5 shadow-xs"
              >
                Save as Draft
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-10 px-6 shadow-xs">
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit & Print Admission Challan
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: BULK IMPORT (CLEAN DROPZONE & GUIDELINES)           */}
        {/* ========================================================= */}
        <TabsContent value="import" className="focus-visible:outline-none">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card className="rounded-xl border border-slate-200/80 bg-white p-10 shadow-xs">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-12 text-center transition-all hover:border-blue-400 hover:bg-blue-50/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Upload Student Registry Excel / CSV
                </h3>
                <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                  Drag and drop your spreadsheet here, or click to browse from your computer. Supports .xlsx and .csv formats up to 10MB.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                    Download Blank Template (.xlsx)
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium">
                    Browse File
                  </Button>
                </div>
              </div>

              {/* Guidelines Grid */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">
                      Standard Headers
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Keep column headers unmodified as defined in the template.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">
                      Phone Number Format
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Include 11-digit numbers (e.g. 03001234567) for WhatsApp dispatch.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">
                      Auto-Deduplication
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Existing Roll IDs are flagged and verified before database insert.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =========================================================
// HELPER: Status Badge with Clean, Pure Colors
// =========================================================
function StatusBadge({ status }: { status: "active" | "defaulter" | "pending" }) {
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

// =========================================================
// HELPER: Actions Menu & Student Profile Sheet (Drawer)
// =========================================================
function StudentActionsMenu({ student }: { student: Student }) {
  return (
    <Sheet>
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
          <SheetTrigger
            render={
              <DropdownMenuItem className="cursor-pointer text-xs font-medium">
                <Users className="mr-2 h-3.5 w-3.5 text-slate-500" />
                View Full Profile
              </DropdownMenuItem>
            }
          />
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

      {/* Slide-out Student Profile Drawer */}
      <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto bg-white p-6">
        <SheetHeader className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-sm">
              {student.avatar}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold text-slate-900">
                  {student.name}
                </SheetTitle>
                <StatusBadge status={student.status} />
              </div>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                {student.id} • {student.class} ({student.section})
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Contact & Details Bar */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Father / Guardian
              </span>
              <span className="font-semibold text-slate-800">
                {student.guardian}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Phone (WhatsApp)
              </span>
              <span className="font-semibold text-slate-800">
                {student.phone}
              </span>
            </div>
          </div>

          {/* Fee History / Ledger */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fee Ledger & Invoices
              </h4>
              <span className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                View Ledger
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    October 2026 Tuition
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Paid via Cash on Oct 03, 2026
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3 w-3" /> Paid Rs 3,000
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    September 2026 Tuition
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Paid via Bank Transfer on Sep 05, 2026
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3 w-3" /> Paid Rs 3,000
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Attendance Summary (Fall Session)
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <span className="block text-xl font-bold text-emerald-700">
                  18
                </span>
                <span className="text-[11px] font-medium text-emerald-600">
                  Days Present
                </span>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
                <span className="block text-xl font-bold text-rose-700">
                  2
                </span>
                <span className="text-[11px] font-medium text-rose-600">
                  Days Absent
                </span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                <span className="block text-xl font-bold text-amber-700">
                  0
                </span>
                <span className="text-[11px] font-medium text-amber-600">
                  Approved Leaves
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}