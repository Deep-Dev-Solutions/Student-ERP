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
  Search,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { statusVariant } from "@/lib/status";
import { formatRupees } from "@/lib/format";
import { useGetPayrollQuery } from "@/store/api";
import { PayrollRecord } from "../types";
import { useReadOnly } from "@/hooks/use-academics";

const transferLabels: Record<PayrollRecord["status"], string> = {
  paid: "Transferred",
  processing: "Processing",
  pending: "Not started",
};

export function PayrollList() {
  const readOnly = useReadOnly();
  const { data: payroll = [] } = useGetPayrollQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedSlips, setGeneratedSlips] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  const filteredPayroll = payroll.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDisbursal = payroll.reduce((acc, p) => acc + p.netSalary, 0);
  const totalDeductions = payroll.reduce((acc, p) => acc + p.deductions, 0);
  const totalBase = payroll.reduce((acc, p) => acc + p.baseSalary, 0);

  const handleGeneratePayslip = (id: string) => {
    if (generatedSlips.includes(id)) return;
    setGeneratedSlips((prev) => [...prev, id]);
  };

  const handleProcessAllPayroll = () => {
    setIsBulkProcessing(true);
    setTimeout(() => {
      setIsBulkProcessing(false);
      setBulkDone(true);
      setGeneratedSlips(payroll.map((p) => p.id));
      setTimeout(() => setBulkDone(false), 3500);
    }, 1200);
  };

  const paidCount = payroll.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Net payroll" value={formatRupees(totalDisbursal)} footer="Payable for October 2026" />
        <StatCard label="Base salaries" value={formatRupees(totalBase)} footer="Before allowances" />
        <StatCard label="Tax and deductions" value={formatRupees(totalDeductions)} footer="Income tax and EOBI" />
        <StatCard
          label="Salaries transferred"
          value={`${paidCount} of ${payroll.length}`}
          footer={`${Math.round((paidCount / payroll.length) * 100)}% of staff paid`}
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Payroll, October 2026</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Salaries, deductions and payslips for this month.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline">
                <Download data-icon="inline-start" />
                Export tax sheet
              </Button>
              <Button onClick={handleProcessAllPayroll} disabled={readOnly || isBulkProcessing || generatedSlips.length === payroll.length}>
                {isBulkProcessing ? (
                  <>
                    <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileText data-icon="inline-start" />
                    Generate all payslips
                  </>
                )}
              </Button>
            </div>
          </div>

          {bulkDone ? (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4 shrink-0" />
              Payslips generated for all {payroll.length} staff members.
            </p>
          ) : null}

          <div className="relative max-w-md">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search payroll"
              placeholder="Name, staff ID or department"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-card pl-9"
            />
          </div>
        </div>

        {filteredPayroll.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No payroll records match"
            description="Try a different name, staff ID or department."
            action={
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden pl-5 2xl:table-cell">Staff ID</TableHead>
                <TableHead className="pl-5 2xl:pl-3">Name</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Base</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Allowances</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Deductions</TableHead>
                <TableHead className="text-right">Net salary</TableHead>
                <TableHead className="hidden sm:table-cell">Transfer</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Payslip</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredPayroll.map((item) => {
                const isGenerated = generatedSlips.includes(item.id);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="hidden pl-5 text-muted-foreground 2xl:table-cell">{item.staffId}</TableCell>
                    <TableCell className="min-w-40 pl-5 whitespace-normal 2xl:pl-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.role}, {item.department}
                        <span className="2xl:hidden"> · {item.staffId}</span>
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-right xl:table-cell">{formatRupees(item.baseSalary)}</TableCell>
                    <TableCell className="hidden text-right xl:table-cell">+{formatRupees(item.allowances)}</TableCell>
                    <TableCell className="hidden text-right xl:table-cell">−{formatRupees(item.deductions)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatRupees(item.netSalary)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusVariant(item.status)}>{transferLabels[item.status]}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {isGenerated ? (
                        <Button variant="ghost" size="sm" aria-label={`Print payslip for ${item.name}`}>
                          <Printer />
                          <span className="hidden 2xl:inline">Print slip</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePayslip(item.id)}
                          aria-label={`Generate payslip for ${item.name}`}
                        >
                          <FileText />
                          <span className="hidden 2xl:inline">Generate slip</span>
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
            Showing {filteredPayroll.length} of {payroll.length} staff
          </p>
          <p>
            Month total: <span className="font-semibold text-foreground">{formatRupees(totalDisbursal)}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
