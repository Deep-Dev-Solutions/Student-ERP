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
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { useToday } from "@/features/attendance/hooks";
import { usePlacement } from "@/features/students/hooks";
import { primaryGuardian } from "@/features/students/status";
import { downloadFile, toCsv } from "@/lib/csv";
import { daysOverdue, monthLabel, voucherBalance, voucherState } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import {
  useGetFeeRemindersQuery,
  useGetPaymentsQuery,
  useGetStudentsQuery,
  useGetVouchersQuery,
  useSendFeeRemindersMutation,
} from "@/store/api";

type Severity = "warning" | "defaulter" | "critical";

const severityOptions = [
  { value: "all", label: "Any time overdue" },
  { value: "warning", label: "Under 30 days" },
  { value: "defaulter", label: "30 to 60 days" },
  { value: "critical", label: "Over 60 days" },
];

const severityLabels: Record<Severity, string> = {
  warning: "Under 30 days",
  defaulter: "30 to 60 days",
  critical: "Over 60 days",
};

export function DefaultersTable() {
  const readOnly = useReadOnly();
  const today = useToday();
  const branch = useCurrentBranch();
  const placement = usePlacement();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: payments = [] } = useGetPaymentsQuery();
  const { data: reminders = [] } = useGetFeeRemindersQuery();
  const [sendReminders, { isLoading: isBulkSending }] = useSendFeeRemindersMutation();
  const classes = useBranchClasses();
  const classOptions = [
    { value: "all", label: "All classes" },
    ...classes.map((c) => ({ value: c.name.toLowerCase().replace(/\s+/g, "-"), label: c.name })),
  ];
  const [searchQuery, setSearchQuery] = useUrlParam("q", "");
  const [selectedClass, setSelectedClass] = useUrlParam("class", "all");
  const [selectedSeverity, setSelectedSeverity] = useUrlParam("severity", "all");
  const [bulkSentSuccess, setBulkSentSuccess] = useState<number | null>(null);

  // One row per student with overdue vouchers at this campus, from the vouchers themselves.
  const overdue = vouchers.filter((v) => v.branchId === branch?.id && voucherState(v, today) === "overdue");
  const defaulters = [...new Set(overdue.map((v) => v.studentId))].map((studentId) => {
    const student = students.find((s) => s.id === studentId);
    const own = overdue.filter((v) => v.studentId === studentId).sort((a, b) => a.month.localeCompare(b.month));
    const guardian = student ? primaryGuardian(student) : undefined;
    const where = student ? placement(student) : undefined;
    const days = today ? daysOverdue(own[0], today) : 0;
    const status: Severity = days > 60 ? "critical" : days >= 30 ? "defaulter" : "warning";
    const lastPayment = payments.filter((p) => p.studentId === studentId && !p.reversed).sort((a, b) => b.at.localeCompare(a.at))[0];
    return {
      id: studentId,
      studentId,
      studentName: student?.name ?? studentId,
      className: where?.className ?? "",
      section: where?.sectionLabel ?? "",
      guardianName: guardian?.name ?? "—",
      guardianPhone: guardian?.phone ?? "—",
      monthsUnpaid: own.map((v) => monthLabel(v.month).replace(/ \d{4}$/, "")),
      totalArrears: own.reduce((n, v) => n + voucherBalance(v), 0),
      daysOverdue: days,
      lastPaymentDate: lastPayment ? formatDate(lastPayment.at.slice(0, 10)) : undefined,
      status,
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  const sentReminders = reminders.filter((r) => r.at.slice(0, 10) === today).map((r) => r.studentId);

  const filteredDefaulters = defaulters.filter((student) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      student.studentName.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.guardianName.toLowerCase().includes(q) ||
      student.guardianPhone.includes(searchQuery);

    const matchesClass =
      selectedClass === "all" ||
      student.className.toLowerCase().replace(/\s+/g, "-") === selectedClass;

    const matchesSeverity =
      selectedSeverity === "all" || student.status === selectedSeverity;

    return matchesSearch && matchesClass && matchesSeverity;
  });

  const totalOutstanding = defaulters.reduce((sum, d) => sum + d.totalArrears, 0);
  const criticalCount = defaulters.filter((d) => d.status === "critical").length;

  const handleSendReminder = (id: string) => {
    if (sentReminders.includes(id)) return;
    sendReminders([id]);
  };

  const handleBulkReminders = async () => {
    const ids = filteredDefaulters.map((d) => d.id).filter((id) => !sentReminders.includes(id));
    const result = await sendReminders(ids);
    if (!("error" in result)) setBulkSentSuccess(ids.length);
  };

  const exportCsv = () =>
    downloadFile(
      `overdue-fees-${branch?.code ?? "campus"}-${today ?? ""}.csv`,
      toCsv([
        ["Roll ID", "Student", "Class", "Section", "Guardian", "Mobile", "Months unpaid", "Arrears (Rs)", "Days overdue", "Last paid"],
        ...filteredDefaulters.map((d) => [d.studentId, d.studentName, d.className, d.section, d.guardianName, d.guardianPhone, d.monthsUnpaid.join(" "), d.totalArrears, d.daysOverdue, d.lastPaymentDate ?? "never"]),
      ])
    );

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
        <StatCard label="Total arrears" value={formatRupees(totalOutstanding)} footer="Outstanding across all classes" />
        <StatCard label="Students with overdue fees" value={defaulters.length} footer="Past the due date" />
        <StatCard
          label="Over 60 days"
          value={criticalCount}
          footer={<Badge variant="danger">Needs a principal&apos;s notice</Badge>}
        />
        <StatCard
          label="Reminders sent today"
          value={`${sentReminders.length} of ${defaulters.length}`}
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
              <Button variant="outline" onClick={exportCsv} disabled={filteredDefaulters.length === 0}>
                <Download data-icon="inline-start" />
                Export CSV
              </Button>
              <Button onClick={handleBulkReminders} disabled={readOnly || isBulkSending || filteredDefaulters.every((d) => sentReminders.includes(d.id))}>
                {isBulkSending ? (
                  <>
                    <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send data-icon="inline-start" />
                    {isFiltered ? "Send SMS to these" : "Send SMS to all"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {bulkSentSuccess ? (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4 shrink-0" />
              SMS reminders sent to {bulkSentSuccess} guardians.
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
                      <p className="text-xs text-muted-foreground">{student.daysOverdue} days past the oldest due date</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-semibold">{formatRupees(student.totalArrears)}</p>
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
                          disabled={readOnly}
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
            Showing {filteredDefaulters.length} of {defaulters.length} accounts
          </p>
          <p>
            Total shown: <span className="font-semibold text-foreground">{formatRupees(filteredTotal)}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
