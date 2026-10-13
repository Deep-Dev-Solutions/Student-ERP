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
  MessageSquare,
  Clock,
  Phone,
  CheckCircle2,
  Send,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { statusVariant } from "@/lib/status";
import { DefaulterRecord } from "../types";

const classOptions = [
  { value: "all", label: "All classes" },
  { value: "class-8", label: "Class 8" },
  { value: "class-9", label: "Class 9" },
  { value: "class-10", label: "Class 10" },
];

const severityOptions = [
  { value: "all", label: "Any time overdue" },
  { value: "warning", label: "Under 30 days" },
  { value: "defaulter", label: "30 to 60 days" },
  { value: "critical", label: "Over 60 days" },
];

const severityLabels: Record<DefaulterRecord["status"], string> = {
  warning: "Under 30 days",
  defaulter: "30 to 60 days",
  critical: "Over 60 days",
};

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

  const filteredTotal = filteredDefaulters.reduce((acc, d) => acc + d.totalArrears, 0);
  const isFiltered = searchQuery !== "" || selectedClass !== "all" || selectedSeverity !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedClass("all");
    setSelectedSeverity("all");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total arrears" value={`Rs ${totalOutstanding.toLocaleString()}`} footer="Outstanding across all classes" />
        <StatCard label="Students with overdue fees" value={mockDefaulters.length} footer="More than 15 days overdue" />
        <StatCard
          label="Over 60 days"
          value={criticalCount}
          footer={<Badge variant="danger">Needs a principal&apos;s notice</Badge>}
        />
        <StatCard
          label="Reminders sent today"
          value={`${sentReminders.length} of ${mockDefaulters.length}`}
          footer="SMS to guardians"
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Overdue fees</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Track overdue balances and send SMS reminders to guardians.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline">
                <Download data-icon="inline-start" />
                Export CSV
              </Button>
              <Button onClick={handleBulkReminders} disabled={isBulkSending || sentReminders.length === mockDefaulters.length}>
                {isBulkSending ? (
                  <>
                    <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send data-icon="inline-start" />
                    Send SMS to all
                  </>
                )}
              </Button>
            </div>
          </div>

          {bulkSentSuccess ? (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4 shrink-0" />
              SMS reminders sent to all {mockDefaulters.length} guardians.
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search overdue accounts"
                placeholder="Student name, roll ID or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-card pl-9"
              />
            </div>
            <div className="sm:col-span-3">
              <Select items={classOptions} value={selectedClass} onValueChange={(val) => val && setSelectedClass(val)}>
                <SelectTrigger aria-label="Filter by class" className="h-9 w-full bg-card">
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
            </div>
            <div className="sm:col-span-3">
              <Select items={severityOptions} value={selectedSeverity} onValueChange={(val) => val && setSelectedSeverity(val)}>
                <SelectTrigger aria-label="Filter by how long overdue" className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredDefaulters.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No overdue accounts match"
            description="Try another name or roll ID, or clear the filters."
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
                <TableHead className="hidden pl-5 2xl:table-cell">Roll ID</TableHead>
                <TableHead className="pl-5 2xl:pl-3">Student</TableHead>
                <TableHead className="hidden xl:table-cell">Guardian</TableHead>
                <TableHead className="hidden 2xl:table-cell">Months unpaid</TableHead>
                <TableHead className="text-right">Arrears</TableHead>
                <TableHead className="hidden sm:table-cell">Overdue</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Reminder</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDefaulters.map((student) => {
                const isSent = sentReminders.includes(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="hidden pl-5 text-muted-foreground 2xl:table-cell">{student.studentId}</TableCell>
                    <TableCell className="min-w-36 pl-5 whitespace-normal 2xl:pl-3">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.className}, {student.section}
                        <span className="2xl:hidden"> · {student.studentId}</span>
                      </p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <p>{student.guardianName}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone aria-hidden className="size-3" />
                        {student.guardianPhone}
                      </p>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <p>{student.monthsUnpaid.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{student.daysOverdue} days past due</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-semibold">Rs {student.totalArrears.toLocaleString()}</p>
                      <p className="hidden text-xs text-muted-foreground lg:block">Last paid {student.lastPaymentDate || "never"}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusVariant(student.status)}>{severityLabels[student.status]}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-success">
                          <CheckCircle2 aria-hidden className="size-4" />
                          Sent
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(student.id)}
                          aria-label={`Send SMS reminder to ${student.guardianName}`}
                        >
                          <MessageSquare />
                          <span className="hidden lg:inline">Send SMS</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-1 border-t border-border bg-muted/50 px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Showing {filteredDefaulters.length} of {mockDefaulters.length} accounts
          </p>
          <p>
            Total shown: <span className="font-semibold text-foreground">Rs {filteredTotal.toLocaleString()}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
