"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, FilePlus2, Printer, Search, Receipt, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { SortableHead, TablePagination, useTableState } from "@/components/shared/DataTableParts";
import { useToday } from "@/features/attendance/hooks";
import { usePlacement } from "@/features/students/hooks";
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { monthLabel, voucherBalance, voucherLines, voucherState, voucherStateLabels } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import {
  errorMessage,
  useCancelVoucherMutation,
  useGenerateVouchersMutation,
  useGetFeeHeadsQuery,
  useGetFeePlansQuery,
  useGetSchoolRulesQuery,
  useGetStudentsQuery,
  useGetVouchersQuery,
} from "@/store/api";
import type { FeeVoucher } from "@/types";

const stateVariant = { paid: "success", partial: "warning", unpaid: "neutral", overdue: "danger", cancelled: "neutral" } as const;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "outstanding", label: "Not fully paid" },
  { value: "overdue", label: "Overdue" },
  { value: "partial", label: "Partly paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const nextMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** Generate a month's vouchers, with a preview of what will be created. */
function GenerateVouchers({ latestMonth }: { latestMonth: string }) {
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: plans = [] } = useGetFeePlansQuery();
  const { data: heads = [] } = useGetFeeHeadsQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const [generate, { isLoading }] = useGenerateVouchersMutation();
  const [month, setMonth] = useState(() => nextMonth(latestMonth));
  const [classId, setClassId] = useState("all");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});

  const due = dueDate ?? (month ? `${month}-${String(rules?.fees.dueDay ?? 10).padStart(2, "0")}` : "");
  const eligible = students.filter(
    (s) =>
      s.branchId === branch?.id &&
      s.enrollment === "active" &&
      (classId === "all" || s.classId === classId) &&
      !vouchers.some((v) => v.studentId === s.id && v.month === month && v.status !== "cancelled")
  );
  const preview = eligible.map((s) => {
    const { lines, discount } = voucherLines(s, month, plans.find((p) => p.classId === s.classId), heads);
    return lines.reduce((n, l) => n + l.amount, 0) - discount;
  });
  const total = preview.reduce((n, x) => n + x, 0);
  const already = students.filter((s) => s.branchId === branch?.id && s.enrollment === "active" && (classId === "all" || s.classId === classId)).length - eligible.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await generate({ month, dueDate: due, studentIds: eligible.map((s) => s.id) });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `${result.data.created} vouchers created for ${monthLabel(month)}${result.data.skipped ? `, ${result.data.skipped} skipped` : ""}.` });
  };

  return (
    <Card className="gap-5 px-6">
      <div>
        <CardTitle>
          <h2>Generate vouchers</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">Monthly vouchers from each class&apos;s fee plan, with each student&apos;s own tuition and discount.</CardDescription>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField id="gen-month" label="Billing month" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setDueDate(null); setNotice({}); }} />
          <SelectField
            id="gen-class"
            label="Classes"
            options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            value={classId}
            onValueChange={(v) => { setClassId(v); setNotice({}); }}
          />
          <TextField id="gen-due" label="Due date" type="date" value={due} onChange={(e) => setDueDate(e.target.value)} hint={`Late fine of ${formatRupees(rules?.fees.lateFinePerDay ?? 0)} a day after ${rules?.fees.graceDays ?? 0} days' grace.`} />
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold">{eligible.length}</span> vouchers totalling <span className="font-semibold tabular-nums">{formatRupees(total)}</span>
            {already ? <span className="text-muted-foreground">. {already} students already have one for {monthLabel(month)}.</span> : null}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus success={notice.ok} error={notice.error} />
          <Button type="submit" disabled={isLoading || eligible.length === 0 || !month}>
            <FilePlus2 data-icon="inline-start" />
            Generate {eligible.length} vouchers
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CancelVoucherDialog({ voucher, onClose, onDone }: { voucher: FeeVoucher; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancel, { isLoading }] = useCancelVoucherMutation();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await cancel({ id: voucher.id, reason });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`Voucher ${voucher.voucherNumber} cancelled.`);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Cancel voucher {voucher.voucherNumber}</DialogTitle>
            <DialogDescription>It stays on record as cancelled and stops counting towards the balance.</DialogDescription>
          </DialogHeader>
          <TextField id="cancel-reason" label="Reason" placeholder="e.g. Issued twice by mistake" value={reason} onChange={(e) => setReason(e.target.value)} />
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Keep voucher</DialogClose>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              Cancel voucher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VouchersPanel() {
  const readOnly = useReadOnly();
  const today = useToday();
  const branch = useCurrentBranch();
  const canManage = useCan("fin_manage_fees") && !readOnly;
  const placement = usePlacement();
  const classes = useBranchClasses();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const atCampus = vouchers.filter((v) => v.branchId === branch?.id);
  const months = [...new Set(atCampus.map((v) => v.month))].sort().reverse();
  const latest = months[0] ?? (today ?? "2026-10-01").slice(0, 7);

  const [monthParam, setMonth] = useUrlParam("vmonth", "");
  const [classFilter, setClassFilter] = useUrlParam("vclass", "all");
  const [statusFilter, setStatusFilter] = useUrlParam("vstatus", "all");
  const [query, setQuery] = useUrlParam("vq", "");
  const [cancelling, setCancelling] = useState<FeeVoucher | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const table = useTableState("student");
  const month = monthParam || latest;

  const studentOf = (v: FeeVoucher) => students.find((s) => s.id === v.studentId);
  const q = query.trim().toLowerCase();
  const filtered = atCampus.filter((v) => {
    if (month !== "all" && v.month !== month) return false;
    if (classFilter !== "all" && v.classId !== classFilter) return false;
    const state = voucherState(v, today);
    if (statusFilter === "outstanding" ? voucherBalance(v) === 0 : statusFilter !== "all" && state !== statusFilter) return false;
    if (!q) return true;
    const s = studentOf(v);
    return v.voucherNumber.toLowerCase().includes(q) || v.studentId.toLowerCase().includes(q) || Boolean(s?.name.toLowerCase().includes(q));
  });
  const view = table.apply(filtered, (v, key) =>
    key === "amount" ? v.totalAmount : key === "due" ? voucherBalance(v) : key === "voucher" ? v.voucherNumber : (studentOf(v)?.name ?? v.studentId)
  );
  const totals = filtered.reduce((t, v) => ({ billed: t.billed + (v.status === "cancelled" ? 0 : v.totalAmount), due: t.due + voucherBalance(v) }), { billed: 0, due: 0 });
  const printHref = `/print/vouchers?month=${month}${classFilter !== "all" ? `&class=${classFilter}` : ""}${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`;

  const filters = [
    { label: "Billing month", items: [{ value: "all", label: "All months" }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))], value: month, set: (v: string) => setMonth(v === latest ? "" : v), width: "w-40" },
    { label: "Filter by class", items: [{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))], value: classFilter, set: setClassFilter, width: "w-36" },
    { label: "Filter by status", items: statusOptions, value: statusFilter, set: setStatusFilter, width: "w-40" },
  ];

  return (
    <div className="space-y-6">
      {canManage ? <GenerateVouchers latestMonth={latest} /> : null}

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Vouchers</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatRupees(totals.billed)} billed, {formatRupees(totals.due)} still owed in this list.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.open(printHref, "_blank", "noopener")} disabled={filtered.length === 0}>
              <Printer data-icon="inline-start" />
              Print these vouchers
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" aria-label="Search vouchers" placeholder="Voucher number, roll ID or name" value={query} onChange={(e) => { setQuery(e.target.value); table.resetPage(); }} className="h-9 bg-card pl-9" />
            </div>
            {filters.map((f) => (
              <Select key={f.label} items={f.items} value={f.value} onValueChange={(v) => { if (v) { f.set(v); table.resetPage(); } }}>
                <SelectTrigger aria-label={f.label} className={`h-9 ${f.width} bg-card`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.items.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
          {notice ? <FormStatus success={notice} /> : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No vouchers match" description="Choose another month or status, or generate this month's vouchers above." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Voucher" column="voucher" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="hidden pl-5 lg:table-cell" />
                  <SortableHead label="Student" column="student" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="pl-5 lg:pl-3" />
                  <TableHead className="hidden xl:table-cell">Due date</TableHead>
                  <SortableHead label="Amount" column="amount" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="hidden text-right lg:table-cell" />
                  <SortableHead label="Owed" column="due" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="text-right" />
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rows.map((v) => {
                  const s = studentOf(v);
                  const p = s ? placement(s) : undefined;
                  const state = voucherState(v, today);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="hidden pl-5 text-muted-foreground lg:table-cell">{v.voucherNumber}</TableCell>
                      <TableCell className="pl-5 whitespace-normal lg:pl-3">
                        <Link href={`/students/${v.studentId}?tab=fees`} className="rounded font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40">
                          {s?.name ?? v.studentId}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {p?.className}, {p?.sectionLabel}, {monthLabel(v.month)}
                        </p>
                        <Badge variant={stateVariant[state]} className="mt-1 lg:hidden">
                          {voucherStateLabels[state]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDate(v.dueDate)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatRupees(v.totalAmount)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatRupees(voucherBalance(v))}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={stateVariant[state]}>{voucherStateLabels[state]}</Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`Print voucher ${v.voucherNumber}`} onClick={() => window.open(`/print/vouchers/${v.id}`, "_blank", "noopener")}>
                            <Printer />
                          </Button>
                          {voucherBalance(v) > 0 ? (
                            <Link
                              href={`/fees?find=${v.voucherNumber}`}
                              aria-label={`Collect payment for ${v.voucherNumber}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                            >
                              <Wallet className="size-4" />
                            </Link>
                          ) : null}
                          {canManage && v.status !== "cancelled" && v.paidAmount === 0 ? (
                            <Button variant="ghost" size="icon-sm" aria-label={`Cancel voucher ${v.voucherNumber}`} onClick={() => setCancelling(v)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                              <Ban />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination page={view.page} pageCount={view.pageCount} total={view.total} pageSize={table.pageSize} noun="vouchers" onPage={table.setPage} />
          </>
        )}
      </Card>

      {cancelling ? <CancelVoucherDialog voucher={cancelling} onClose={() => setCancelling(null)} onDone={setNotice} /> : null}
    </div>
  );
}
