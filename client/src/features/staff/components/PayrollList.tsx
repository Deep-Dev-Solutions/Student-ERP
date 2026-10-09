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
  Search,
  FileText,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  TrendingUp,
  Percent,
} from "lucide-react";
import { PayrollRecord } from "../types";

const mockPayroll: PayrollRecord[] = [
  {
    id: "pay-1",
    staffId: "STF-201",
    name: "Dr. Tariq Mahmood",
    avatar: "TM",
    role: "Senior Physics Lecturer",
    department: "Science",
    baseSalary: 110000,
    allowances: 15000,
    deductions: 8500,
    netSalary: 116500,
    month: "October 2026",
    status: "paid",
  },
  {
    id: "pay-2",
    staffId: "STF-202",
    name: "Saima Nazir",
    avatar: "SN",
    role: "Head of Mathematics",
    department: "Mathematics",
    baseSalary: 125000,
    allowances: 18000,
    deductions: 9200,
    netSalary: 133800,
    month: "October 2026",
    status: "paid",
  },
  {
    id: "pay-3",
    staffId: "STF-203",
    name: "Rashid Minhas",
    avatar: "RM",
    role: "Chemistry Teacher",
    department: "Science",
    baseSalary: 85000,
    allowances: 8000,
    deductions: 5500,
    netSalary: 87500,
    month: "October 2026",
    status: "processing",
  },
  {
    id: "pay-4",
    staffId: "STF-204",
    name: "Ayesha Siddiqua",
    avatar: "AS",
    role: "English Literature Instructor",
    department: "Humanities",
    baseSalary: 78000,
    allowances: 7000,
    deductions: 4200,
    netSalary: 80800,
    month: "October 2026",
    status: "pending",
  },
  {
    id: "pay-5",
    staffId: "STF-205",
    name: "Kamran Akram",
    avatar: "KA",
    role: "Computer Science Teacher",
    department: "IT & CS",
    baseSalary: 95000,
    allowances: 12000,
    deductions: 6400,
    netSalary: 100600,
    month: "October 2026",
    status: "paid",
  },
];

export function PayrollList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedSlips, setGeneratedSlips] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  const filteredPayroll = mockPayroll.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDisbursal = mockPayroll.reduce((acc, p) => acc + p.netSalary, 0);
  const totalDeductions = mockPayroll.reduce((acc, p) => acc + p.deductions, 0);
  const totalBase = mockPayroll.reduce((acc, p) => acc + p.baseSalary, 0);

  const handleGeneratePayslip = (id: string) => {
    if (generatedSlips.includes(id)) return;
    setGeneratedSlips((prev) => [...prev, id]);
  };

  const handleProcessAllPayroll = () => {
    setIsBulkProcessing(true);
    setTimeout(() => {
      setIsBulkProcessing(false);
      setBulkDone(true);
      setGeneratedSlips(mockPayroll.map((p) => p.id));
      setTimeout(() => setBulkDone(false), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Net Disbursal
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              Rs. {totalDisbursal.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Net payable for October 2026
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Base Remuneration
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 font-mono">
              Rs. {totalBase.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Gross base scale commitment
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Tax & Deductions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/70">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-rose-600 font-mono">
              Rs. {totalDeductions.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Income tax withholding & EOBI
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Disbursal Status
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              60% Disbursed
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              3 of 5 transfers cleared
            </p>
          </div>
        </Card>
      </div>

      {/* Main Payroll Table Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Staff Payroll Registry
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  October 2026
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Calculate salary packages, process statutory deductions, and generate formal payslips.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Export Tax Sheet
              </Button>

              <Button
                size="sm"
                onClick={handleProcessAllPayroll}
                disabled={isBulkProcessing}
                className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                {isBulkProcessing ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Generating Slips...
                  </>
                ) : bulkDone ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    All Slips Issued!
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    Generate All Payslips
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search payroll by faculty name, staff ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg max-w-md"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Staff ID
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Employee Name
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Base Salary
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Allowances
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Deductions
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Net Salary
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Transfer Status
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPayroll.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-500"
                    >
                      <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        No payroll records found
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try modifying your search query.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayroll.map((item) => {
                    const isGenerated = generatedSlips.includes(item.id);

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                      >
                        {/* ID */}
                        <TableCell className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                          {item.staffId}
                        </TableCell>

                        {/* Name */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                              {item.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 leading-tight">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {item.role} • {item.department}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Base Salary */}
                        <TableCell className="py-4 px-4 text-right font-mono text-xs text-slate-700">
                          Rs. {item.baseSalary.toLocaleString()}
                        </TableCell>

                        {/* Allowances */}
                        <TableCell className="py-4 px-4 text-right font-mono text-xs text-emerald-600">
                          +Rs. {item.allowances.toLocaleString()}
                        </TableCell>

                        {/* Deductions */}
                        <TableCell className="py-4 px-4 text-right font-mono text-xs text-rose-600">
                          -Rs. {item.deductions.toLocaleString()}
                        </TableCell>

                        {/* Net Salary */}
                        <TableCell className="py-4 px-4 text-right font-mono text-sm font-bold text-slate-900">
                          Rs. {item.netSalary.toLocaleString()}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 px-4 text-center">
                          {item.status === "paid" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Disbursed
                            </span>
                          )}
                          {item.status === "processing" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Processing
                            </span>
                          )}
                          {item.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Pending
                            </span>
                          )}
                        </TableCell>

                        {/* Generate Payslip Action */}
                        <TableCell className="py-4 px-4 text-right">
                          <Button
                            variant={isGenerated ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => handleGeneratePayslip(item.id)}
                            className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                              isGenerated
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-xs"
                            }`}
                          >
                            {isGenerated ? (
                              <>
                                <Printer className="h-3.5 w-3.5 text-emerald-600" />
                                Slip Ready
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                Generate Payslip
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
                {filteredPayroll.length}
              </span>{" "}
              of {mockPayroll.length} payroll accounts
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-slate-600">
                Total Month Disbursal:{" "}
                <span className="font-mono font-bold text-slate-900">
                  Rs. {totalDisbursal.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

