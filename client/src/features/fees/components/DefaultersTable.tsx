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
  MessageSquare,
  AlertTriangle,
  TrendingDown,
  Clock,
  Phone,
  CheckCircle2,
  Send,
  Calendar,
  FileSpreadsheet,
  Download,
  Filter,
} from "lucide-react";
import { DefaulterRecord } from "../types";

const mockDefaulters: DefaulterRecord[] = [
  {
    id: "def-1",
    studentId: "STD-1004",
    studentName: "Bilal Sheikh",
    avatar: "BS",
    className: "Class 10",
    section: "Section A",
    guardianName: "Sheikh Tariq",
    guardianPhone: "+92 301 5551234",
    monthsUnpaid: ["August", "September", "October"],
    totalArrears: 11400,
    daysOverdue: 72,
    lastPaymentDate: "Jul 28, 2026",
    status: "critical",
  },
  {
    id: "def-2",
    studentId: "STD-1008",
    studentName: "Zainab Malik",
    avatar: "ZM",
    className: "Class 9",
    section: "Section B",
    guardianName: "Malik Naveed",
    guardianPhone: "+92 321 9876543",
    monthsUnpaid: ["September", "October"],
    totalArrears: 7600,
    daysOverdue: 42,
    lastPaymentDate: "Aug 15, 2026",
    status: "defaulter",
  },
  {
    id: "def-3",
    studentId: "STD-1015",
    studentName: "Hamza Abbasi",
    avatar: "HA",
    className: "Class 10",
    section: "Section B",
    guardianName: "Kashif Abbasi",
    guardianPhone: "+92 334 1122334",
    monthsUnpaid: ["July", "August", "September", "October"],
    totalArrears: 15200,
    daysOverdue: 104,
    lastPaymentDate: "Jun 20, 2026",
    status: "critical",
  },
  {
    id: "def-4",
    studentId: "STD-1022",
    studentName: "Ayesha Noor",
    avatar: "AN",
    className: "Class 8",
    section: "Section A",
    guardianName: "Dr. Farooq Noor",
    guardianPhone: "+92 300 4455667",
    monthsUnpaid: ["October"],
    totalArrears: 3800,
    daysOverdue: 24,
    lastPaymentDate: "Sep 05, 2026",
    status: "warning",
  },
  {
    id: "def-5",
    studentId: "STD-1031",
    studentName: "Usman Raza",
    avatar: "UR",
    className: "Class 9",
    section: "Section A",
    guardianName: "Raza Haider",
    guardianPhone: "+92 312 8899001",
    monthsUnpaid: ["August", "September", "October"],
    totalArrears: 11400,
    daysOverdue: 65,
    lastPaymentDate: "Jul 31, 2026",
    status: "critical",
  },
  {
    id: "def-6",
    studentId: "STD-1049",
    studentName: "Mariam Farooq",
    avatar: "MF",
    className: "Class 8",
    section: "Section C",
    guardianName: "Farooq Siddiqui",
    guardianPhone: "+92 345 7766554",
    monthsUnpaid: ["September", "October"],
    totalArrears: 7200,
    daysOverdue: 38,
    lastPaymentDate: "Aug 22, 2026",
    status: "defaulter",
  },
];

export function DefaultersTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [sentReminders, setSentReminders] = useState<string[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkSentSuccess, setBulkSentSuccess] = useState(false);

  const filteredDefaulters = mockDefaulters.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.guardianPhone.includes(searchQuery);

    const matchesClass =
      selectedClass === "all" ||
      student.className.toLowerCase().replace(/\s+/g, "-") === selectedClass;

    const matchesSeverity =
      selectedSeverity === "all" || student.status === selectedSeverity;

    return matchesSearch && matchesClass && matchesSeverity;
  });

  const totalOutstanding = mockDefaulters.reduce(
    (sum, d) => sum + d.totalArrears,
    0
  );
  const criticalCount = mockDefaulters.filter(
    (d) => d.status === "critical"
  ).length;

  const handleSendReminder = (id: string) => {
    if (sentReminders.includes(id)) return;
    setSentReminders((prev) => [...prev, id]);
  };

  const handleBulkReminders = () => {
    setIsBulkSending(true);
    setTimeout(() => {
      setIsBulkSending(false);
      setBulkSentSuccess(true);
      setSentReminders(mockDefaulters.map((d) => d.id));
      setTimeout(() => setBulkSentSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Arrears
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/70">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-rose-600">
              Rs. {totalOutstanding.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Outstanding fee across all classes
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Defaulters
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/70">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {mockDefaulters.length}{" "}
              <span className="text-xs font-normal text-slate-400">
                students
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Accounts with &gt;15 days overdue
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical (60+ Days)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-red-700">
              {criticalCount}{" "}
              <span className="text-xs font-normal text-slate-400">
                accounts
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-600 font-medium">
              Requires immediate principal notice
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SMS Recovery Rate
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              68.4%
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cleared within 48h of reminder
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Arrears & Defaulters Registry
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                  {filteredDefaulters.length} Unresolved
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Monitor aging balances, dispatch automated SMS notices to
                parents, and track recovery status.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Export CSV
              </Button>

              <Button
                size="sm"
                onClick={handleBulkReminders}
                disabled={isBulkSending}
                className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                {isBulkSending ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Sending SMS...
                  </>
                ) : bulkSentSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    Sent to All!
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Bulk SMS to All
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name, roll number, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedClass}
                onValueChange={(val) => {
                  if (val) setSelectedClass(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="class-8">Class 8</SelectItem>
                  <SelectItem value="class-9">Class 9</SelectItem>
                  <SelectItem value="class-10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedSeverity}
                onValueChange={(val) => {
                  if (val) setSelectedSeverity(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                  <SelectValue placeholder="All Overdue Levels" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="all">All Overdue Levels</SelectItem>
                  <SelectItem value="warning">Warning (&lt;30 Days)</SelectItem>
                  <SelectItem value="defaulter">Defaulter (30-60 Days)</SelectItem>
                  <SelectItem value="critical">Critical (&gt;60 Days)</SelectItem>
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
                    Roll ID
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Student Details
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Guardian & Contact
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Months Overdue
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Arrears
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Severity
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredDefaulters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        No outstanding defaulters found
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try modifying your search or filter options.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDefaulters.map((student) => {
                    const isSent = sentReminders.includes(student.id);

                    return (
                      <TableRow
                        key={student.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Roll ID */}
                        <TableCell className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                          {student.studentId}
                        </TableCell>

                        {/* Student Details */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                              {student.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 leading-tight">
                                {student.studentName}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {student.className} • {student.section}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Guardian & Contact */}
                        <TableCell className="py-4 px-4">
                          <div className="text-xs font-medium text-slate-800">
                            {student.guardianName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {student.guardianPhone}
                          </div>
                        </TableCell>

                        {/* Months Overdue */}
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {student.monthsUnpaid.map((m) => (
                              <span
                                key={m}
                                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200/80"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {student.daysOverdue} days past due
                          </div>
                        </TableCell>

                        {/* Total Arrears in BOLD RED */}
                        <TableCell className="py-4 px-4 text-right">
                          <div className="text-sm font-bold font-mono text-rose-600">
                            Rs. {student.totalArrears.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Last paid: {student.lastPaymentDate || "Never"}
                          </div>
                        </TableCell>

                        {/* Severity Badge */}
                        <TableCell className="py-4 px-4 text-center">
                          {student.status === "critical" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Critical
                            </span>
                          )}
                          {student.status === "defaulter" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Overdue
                            </span>
                          )}
                          {student.status === "warning" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              Warning
                            </span>
                          )}
                        </TableCell>

                        {/* SMS Action Button */}
                        <TableCell className="py-4 px-4 text-right">
                          <Button
                            variant={isSent ? "ghost" : "outline"}
                            size="sm"
                            disabled={isSent}
                            onClick={() => handleSendReminder(student.id)}
                            className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                              isSent
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-xs"
                            }`}
                          >
                            {isSent ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                SMS Sent
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                                Send SMS
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer info */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredDefaulters.length}
              </span>{" "}
              of {mockDefaulters.length} students with overdue fees
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-slate-600">
                Filtered Arrears Total:{" "}
                <span className="font-mono font-bold text-rose-600">
                  Rs.{" "}
                  {filteredDefaulters
                    .reduce((acc, curr) => acc + curr.totalArrears, 0)
                    .toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

