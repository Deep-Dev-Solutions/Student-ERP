"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Download, FileText, HandCoins, Lock, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { StatCard } from "@/components/shared/StatCard";
import { useToday } from "@/features/attendance/hooks";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { downloadFile, toCsv } from "@/lib/csv";
import { monthLabel } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import { WORKING_DAYS } from "@/lib/payroll";
import {
  errorMessage,
  useAddAdvanceMutation,
  useFinalisePayrollMutation,
  useGetAdvancesQuery,
  useGetPayrollRunsQuery,
  useGetPayslipsQuery,
  useGetStaffQuery,
  useMarkPayslipsPaidMutation,
  useStartPayrollMutation,
  useUpdatePayslipMutation,
} from "@/store/api";
import type { Payslip, SalaryComponent, StaffMember } from "@/types";
import { localISODate } from "@/lib/dates";

type Method = NonNullable<Payslip["method"]>;
const methodOptions: { value: Method; label: string }[] = [
  { value: "bank", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];
const runLabels = { draft: "Draft", finalised: "Finalised", paid: "Paid" } as const;
const runVariants = { draft: "warning", finalised: "info", paid: "success" } as const;

const shiftMonth = (month: string, by: number) => {
  const d = new Date(`${month}-15T12:00:00`);
  d.setMonth(d.getMonth() + by);
  return d.toISOString().slice(0, 7);
};

export function PayrollList() {
  const today = useToday();
  const branch = useCurrentBranch();
  const readOnly = useReadOnly();
  const canManage = useCan("fin_manage_payroll") && !readOnly;
  const { data: runs = [] } = useGetPayrollRunsQuery();
  const { data: payslips = [] } = useGetPayslipsQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const [startPayroll, { isLoading: starting }] = useStartPayrollMutation();
  const [finalise, { isLoading: finalising }] = useFinalisePayrollMutation();
  const thisMonth = (today ?? "2026-10-01").slice(0, 7);
  const [monthParam, setMonth] = useUrlParam("month", "");
  const month = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : thisMonth;
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const [adjusting, setAdjusting] = useState<Payslip | null>(null);
  const [paying, setPaying] = useState<Payslip[] | null>(null);

  const branchRuns = runs.filter((r) => r.branchId === branch?.id);
  const run = branchRuns.find((r) => r.month === month);
  const monthOptions = [...new Set([shiftMonth(thisMonth, 1), thisMonth, ...branchRuns.map((r) => r.month), month])]
    .sort((a, b) => b.localeCompare(a))
    .map((m) => ({ value: m, label: monthLabel(m) }));
  const memberOf = (staffId: string) => staff.find((m) => m.staffId === staffId);
  const slips = run ? payslips.filter((p) => p.runId === run.id) : [];
  const q = searchQuery.trim().toLowerCase();
  const filtered = slips.filter((p) => {
    const m = memberOf(p.staffId);
    return !q || [m?.name, p.staffId, m?.role, m?.department].some((v) => v?.toLowerCase().includes(q));
  });
  const total = (key: "net" | "gross" | "tax" | "totalDeductions") => slips.reduce((n, p) => n + p[key], 0);
  const paid = slips.filter((p) => p.status === "paid");
  const unpaid = slips.filter((p) => p.status === "draft");

  const act = async (action: Promise<{ error?: unknown } | { data?: unknown }>, success: string) => {
    const result = await action;
    setNotice("error" in result && result.error ? { error: errorMessage(result.error as never) } : { success });
  };

  const exportTaxSheet = () =>
    downloadFile(
      `tax-sheet-${month}.csv`,
      toCsv([
        ["Staff number", "Name", "CNIC", "Gross", "Absence deduction", "Taxable", "Income tax", "EOBI", "Net pay"],
        ...slips.map((p) => {
          const m = memberOf(p.staffId);
          return [p.staffId, m?.name, m?.cnic, p.gross, p.absentDeduction, p.gross - p.absentDeduction, p.tax, p.eobi, p.net];
        }),
      ])
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Net payroll" value={formatRupees(total("net"))} footer={run ? `Payable for ${monthLabel(month)}` : "Not started"} />
        <StatCard label="Gross salaries" value={formatRupees(total("gross"))} footer="Basic, allowances and additions" />
        <StatCard label="Tax and deductions" value={formatRupees(total("totalDeductions"))} footer={`Income tax ${formatRupees(total("tax"))}`} />
        <StatCard
          label="Salaries paid"
          value={`${paid.length} of ${slips.length}`}
          footer={slips.length ? `${Math.round((paid.length / slips.length) * 100)}% of staff paid` : "No payslips yet"}
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <SelectField
                id="payroll-month"
                label="Month"
                className="sm:w-48"
                options={monthOptions}
                value={month}
                onValueChange={(v) => {
                  setMonth(v === thisMonth ? "" : v);
                  setNotice({});
                }}
              />
              {run ? (
                <p className="flex flex-wrap items-center gap-2 pb-2 text-sm text-muted-foreground">
                  <Badge variant={runVariants[run.status]}>{runLabels[run.status]}</Badge>
                  Started {formatDate(run.createdAt.slice(0, 10))} by {run.createdBy}
                </p>
              ) : null}
            </div>
            {run ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportTaxSheet}>
                  <Download data-icon="inline-start" />
                  Export tax sheet
                </Button>
                {run.status === "draft" ? (
                  <Button
                    disabled={!canManage || finalising}
                    onClick={() => act(finalise(run.id), `${monthLabel(month)} payroll finalised. Payslips can no longer change; you can now pay them.`)}
                  >
                    <Lock data-icon="inline-start" />
                    Finalise payroll
                  </Button>
                ) : unpaid.length ? (
                  <Button disabled={!canManage} onClick={() => setPaying(unpaid)}>
                    <Banknote data-icon="inline-start" />
                    Mark all paid
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          {notice.success || notice.error ? (
            <div className={notice.error ? "" : "rounded-lg border border-success/30 bg-success-tint p-3"}>
              <FormStatus success={notice.success} error={notice.error} />
            </div>
          ) : null}
          {run?.status === "draft" ? (
            <p className="text-sm text-muted-foreground">
              Absences come from staff attendance; each absent day takes 1/{WORKING_DAYS} of basic salary. Check each payslip, then finalise.
            </p>
          ) : null}

          {run ? (
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
          ) : null}
        </div>

        {!run ? (
          <EmptyState
            icon={FileText}
            title={`Payroll for ${monthLabel(month)} hasn't started`}
            description="Starting it makes a draft payslip for everyone on staff, with absences and advance recoveries filled in."
            action={
              <Button
                disabled={!canManage || starting || !branch}
                onClick={() => branch && act(startPayroll({ branchId: branch.id, month }), `Draft payslips made for ${monthLabel(month)}.`)}
              >
                <FileText data-icon="inline-start" />
                Start payroll
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
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
                <TableHead className="pl-5">Name</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Gross</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Absent</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Deductions</TableHead>
                <TableHead className="text-right">Net pay</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const m = memberOf(p.staffId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="min-w-40 pl-5 whitespace-normal">
                      <Link href={`/staff/${m?.id}?tab=payslips`} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                        {m?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {m?.role}, {p.staffId}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums xl:table-cell">{formatRupees(p.gross)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">{p.absentDays ? `${p.absentDays} d` : "—"}</TableCell>
                    <TableCell className="hidden text-right tabular-nums xl:table-cell">−{formatRupees(p.totalDeductions)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatRupees(p.net)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={p.status === "paid" ? "success" : run.status === "draft" ? "warning" : "info"}>
                        {p.status === "paid" ? "Paid" : run.status === "draft" ? "Draft" : "Ready to pay"}
                      </Badge>
                      {p.status === "paid" ? (
                        <span className="ml-2 hidden text-xs text-muted-foreground 2xl:inline">{methodOptions.find((o) => o.value === p.method)?.label}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="pr-5 text-right whitespace-nowrap">
                      {run.status === "draft" ? (
                        <Button variant="ghost" size="icon-sm" disabled={!canManage} aria-label={`Adjust payslip for ${m?.name}`} onClick={() => setAdjusting(p)}>
                          <Pencil />
                        </Button>
                      ) : p.status === "draft" ? (
                        <Button variant="outline" size="sm" disabled={!canManage} aria-label={`Mark ${m?.name} paid`} onClick={() => setPaying([p])}>
                          <CheckCircle2 />
                          <span className="hidden 2xl:inline">Mark paid</span>
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon-sm" aria-label={`Print payslip for ${m?.name}`} onClick={() => window.open(`/print/payslips/${p.id}`, "_blank", "noopener")}>
                        <Printer />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {run ? (
          <div className="flex flex-col gap-1 border-t border-border bg-muted/50 px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Showing {filtered.length} of {slips.length} staff
            </p>
            <p>
              Month total: <span className="font-semibold text-foreground">{formatRupees(total("net"))}</span>
            </p>
          </div>
        ) : null}
      </Card>

      <AdvancesCard staff={staff.filter((m) => m.branchId === branch?.id)} canManage={canManage} />

      {adjusting ? (
        <AdjustDialog
          slip={adjusting}
          member={memberOf(adjusting.staffId)}
          onClose={() => setAdjusting(null)}
          onDone={(msg) => setNotice({ success: msg })}
        />
      ) : null}
      {paying ? (
        <PayDialog
          slips={paying}
          name={paying.length === 1 ? memberOf(paying[0].staffId)?.name : undefined}
          onClose={() => setPaying(null)}
          onDone={(msg) => setNotice({ success: msg })}
        />
      ) : null}
    </div>
  );
}

function AdjustDialog({ slip, member, onClose, onDone }: { slip: Payslip; member?: StaffMember; onClose: () => void; onDone: (msg: string) => void }) {
  const [absentDays, setAbsentDays] = useState(String(slip.absentDays));
  const [rows, setRows] = useState<{ label: string; amount: string }[]>(slip.adjustments.map((a) => ({ label: a.label, amount: String(a.amount) })));
  const [error, setError] = useState<string | null>(null);
  const [update, { isLoading }] = useUpdatePayslipMutation();
  const setRow = (i: number, changes: Partial<{ label: string; amount: string }>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...changes } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adjustments: SalaryComponent[] = rows.map((r) => ({ label: r.label.trim(), amount: Number(r.amount.replace(/[^\d-]/g, "")) }));
    const result = await update({ id: slip.id, absentDays: Number(absentDays), adjustments });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`${member?.name}'s payslip updated. Net pay is now ${formatRupees(result.data.net)}.`);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Adjust {member?.name}&apos;s payslip</DialogTitle>
            <DialogDescription>
              {monthLabel(slip.month)}. Use a positive amount for a bonus or overtime and a negative one for a fine or other deduction.
            </DialogDescription>
          </DialogHeader>
          <TextField
            id="adjust-absent"
            label="Absent days (unpaid)"
            inputMode="numeric"
            hint={`Each day takes ${formatRupees(Math.round(slip.basic / WORKING_DAYS))} off.`}
            value={absentDays}
            onChange={(e) => setAbsentDays(e.target.value.replace(/\D/g, ""))}
          />
          <div>
            <p className="mb-2 text-sm font-medium">One-off adjustments</p>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">None this month.</p> : null}
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input aria-label={`Adjustment ${i + 1} reason`} placeholder="e.g. Exam duty" value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} className="h-9 flex-1 bg-card" />
                  <Input
                    aria-label={`Adjustment ${i + 1} amount`}
                    placeholder="e.g. 2000 or -500"
                    inputMode="numeric"
                    value={r.amount}
                    onChange={(e) => setRow(i, { amount: e.target.value.replace(/[^\d-]/g, "") })}
                    className="h-9 w-32 bg-card text-right tabular-nums"
                  />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove adjustment ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setRows([...rows, { label: "", amount: "" }])}>
              <Plus data-icon="inline-start" />
              Add adjustment
            </Button>
          </div>
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              Save payslip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayDialog({ slips, name, onClose, onDone }: { slips: Payslip[]; name?: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [method, setMethod] = useState<Method>("bank");
  const [error, setError] = useState<string | null>(null);
  const [markPaid, { isLoading }] = useMarkPayslipsPaidMutation();
  const total = slips.reduce((n, p) => n + p.net, 0);
  const who = name ?? `${slips.length} staff`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await markPaid({ ids: slips.map((p) => p.id), method });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`${formatRupees(total)} paid to ${who} by ${methodOptions.find((o) => o.value === method)?.label.toLowerCase()}.`);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Mark {who} paid</DialogTitle>
            <DialogDescription>
              {formatRupees(total)} in net pay. Any advance instalments on these payslips are taken off the advances.
            </DialogDescription>
          </DialogHeader>
          <SelectField id="pay-method" label="Paid by" options={methodOptions} value={method} onValueChange={(v) => setMethod(v as Method)} />
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              <Banknote data-icon="inline-start" />
              Mark paid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdvancesCard({ staff, canManage }: { staff: StaffMember[]; canManage: boolean }) {
  const { data: advances = [] } = useGetAdvancesQuery();
  const [giving, setGiving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const mine = advances.filter((a) => staff.some((m) => m.staffId === a.staffId)).sort((a, b) => b.date.localeCompare(a.date));
  const nameOf = (staffId: string) => staff.find((m) => m.staffId === staffId)?.name;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Salary advances</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Recovered in monthly instalments from payslips.</p>
        </div>
        <Button variant="outline" disabled={!canManage} onClick={() => setGiving(true)}>
          <HandCoins data-icon="inline-start" />
          Give advance
        </Button>
      </div>
      {notice ? (
        <div className="border-b border-border px-5 py-3 sm:px-6">
          <FormStatus success={notice} />
        </div>
      ) : null}
      {mine.length === 0 ? (
        <EmptyState icon={HandCoins} title="No advances" description="Advances you give appear here with what's left to recover." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Name</TableHead>
              <TableHead className="hidden md:table-cell">Given</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Amount</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Per month</TableHead>
              <TableHead className="pr-5 text-right">Left to recover</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((a) => {
              const left = a.amount - a.recovered;
              return (
                <TableRow key={a.id}>
                  <TableCell className="pl-5 whitespace-normal">
                    <p className="font-medium">{nameOf(a.staffId)}</p>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(a.date)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatRupees(a.amount)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatRupees(a.monthlyRecovery)}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums">{left > 0 ? formatRupees(left) : <Badge variant="success">Recovered</Badge>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {giving ? <AdvanceDialog staff={staff.filter((m) => m.status !== "terminated")} onClose={() => setGiving(false)} onDone={setNotice} /> : null}
    </Card>
  );
}

function AdvanceDialog({ staff, onClose, onDone }: { staff: StaffMember[]; onClose: () => void; onDone: (msg: string) => void }) {
  const [staffId, setStaffId] = useState(staff[0]?.staffId ?? "");
  const [amount, setAmount] = useState("");
  const [monthly, setMonthly] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => localISODate());
  const [error, setError] = useState<string | null>(null);
  const [addAdvance, { isLoading }] = useAddAdvanceMutation();
  const months = Number(amount) && Number(monthly) ? Math.ceil(Number(amount) / Number(monthly)) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addAdvance({ staffId, amount: Number(amount), monthlyRecovery: Number(monthly), reason, date });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`Advance of ${formatRupees(result.data.amount)} given to ${staff.find((m) => m.staffId === staffId)?.name}.`);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Give a salary advance</DialogTitle>
            <DialogDescription>The monthly instalment is taken from each payslip until the advance is repaid.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField id="adv-staff" label="Staff member" className="sm:col-span-2" options={staff.map((m) => ({ value: m.staffId, label: m.name }))} value={staffId} onValueChange={setStaffId} />
            <TextField id="adv-amount" label="Amount (Rs)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
            <TextField
              id="adv-monthly"
              label="Recover per month (Rs)"
              inputMode="numeric"
              hint={months ? `Repaid in ${months} ${months === 1 ? "month" : "months"}.` : undefined}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value.replace(/\D/g, ""))}
            />
            <TextField id="adv-date" label="Date given" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField id="adv-reason" label="Reason" placeholder="e.g. Medical emergency" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              Give advance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
