"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarCheck, ChevronDown, IdCard, KeyRound, Pencil, Printer, UserRound, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useToday } from "@/features/attendance/hooks";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { useUrlParam, useUrlTab } from "@/hooks/use-url-state";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { monthLabel } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import { MAX_WEEKLY_PERIODS, monthlyGross } from "@/lib/payroll";
import { statusVariant } from "@/lib/status";
import {
  errorMessage,
  useGetAllocationsQuery,
  useGetClassesQuery,
  useGetPayslipsQuery,
  useGetSectionsQuery,
  useGetStaffAttendanceQuery,
  useGetStaffQuery,
  useGetSubjectsQuery,
  useGetUsersQuery,
  useSetStaffStatusMutation,
} from "@/store/api";
import type { StaffMember } from "@/types";

const TABS = ["overview", "teaching", "attendance", "payslips"] as const;
const statusLabels: Record<StaffMember["status"], string> = { active: "Active", on_leave: "On leave", terminated: "Left" };
const employmentLabels: Record<StaffMember["employment"], string> = { permanent: "Permanent", contract: "Contract", visiting: "Visiting" };

function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || "—"}</dd>
    </div>
  );
}

function LeftDialog({ member, onClose, onDone }: { member: StaffMember; onClose: () => void; onDone: (msg: string) => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [setStatus, { isLoading }] = useSetStaffStatusMutation();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await setStatus({ id: member.id, status: "terminated", date, reason });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`${member.name} is marked as left. Their classes are now unassigned.`);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Mark {member.name} as left</DialogTitle>
            <DialogDescription>Their record and payslips are kept. Their teaching allocations and class incharge roles are cleared, so reassign those classes.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField id="left-date" label="Last working day" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField id="left-reason" label="Reason" placeholder="e.g. Resigned" wrapperClassName="sm:col-span-2" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              Mark as left
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffProfile({ staffId }: { staffId: string }) {
  const { data: staff = [] } = useGetStaffQuery();
  const { data: users = [] } = useGetUsersQuery();
  const member = staff.find((m) => m.id === staffId || m.staffId === staffId);
  const [activeTab, setActiveTab] = useUrlTab("overview", TABS);
  const [saved, setSaved] = useUrlParam("saved", "");
  const [notice, setNotice] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [setStatus] = useSetStaffStatusMutation();
  const readOnly = useReadOnly();
  const canEdit = useCan("adm_onboard_staff") && !readOnly;
  const canSeePay = useCan("fin_manage_payroll");

  if (!member) {
    return (
      <Card className="py-0">
        <EmptyState icon={UserRound} title="We couldn't find this staff member" description="They may have been removed." action={<ButtonLink href="/staff">Back to staff</ButtonLink>} />
      </Card>
    );
  }

  const login = users.find((u) => u.staffId === member.staffId);
  const message = saved === "new" ? `${member.name} added with staff number ${member.staffId}.` : saved === "1" ? "Changes saved." : notice;

  const changeStatus = async (status: StaffMember["status"]) => {
    const result = await setStatus({ id: member.id, status });
    setSaved("");
    setNotice("error" in result ? errorMessage(result.error) : status === "on_leave" ? `${member.name} is marked on leave.` : `${member.name} is back from leave.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        meta={<Badge variant={statusVariant(member.status)}>{statusLabels[member.status]}</Badge>}
        description={`${member.staffId}, ${member.role}, ${member.department}.`}
        actions={
          canEdit ? (
            <>
              <ButtonLink href={`/staff/${member.id}/edit`} variant="outline">
                <Pencil data-icon="inline-start" />
                Edit
              </ButtonLink>
              {member.status !== "terminated" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button />}>
                    More actions
                    <ChevronDown data-icon="inline-end" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {member.status === "on_leave" ? (
                      <DropdownMenuItem onClick={() => changeStatus("active")}>Back from leave</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => changeStatus("on_leave")}>Mark on leave</DropdownMenuItem>
                    )}
                    {!login ? <DropdownMenuItem render={<Link href="/settings?tab=users" />}>Give login access</DropdownMenuItem> : null}
                    <DropdownMenuItem variant="destructive" onClick={() => setLeaving(true)}>
                      Mark as left
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          ) : null
        }
      />

      {message ? (
        <div className="rounded-lg border border-success/30 bg-success-tint p-3">
          <FormStatus success={message} />
        </div>
      ) : null}
      {member.left ? (
        <p role="status" className="rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          Left on {formatDate(member.left.date)}: {member.left.reason}.
        </p>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <IdCard />
            Overview
          </TabsTrigger>
          {member.teaches ? (
            <TabsTrigger value="teaching">
              <BookOpen />
              Teaching
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="attendance">
            <CalendarCheck />
            Attendance
          </TabsTrigger>
          {canSeePay ? (
            <TabsTrigger value="payslips">
              <Wallet />
              Payslips
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-4 px-5 sm:px-6">
              <CardTitle>
                <h2>Personal and employment</h2>
              </CardTitle>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Mobile">{member.phone}</Detail>
                <Detail label="Email">{member.email}</Detail>
                <Detail label="CNIC">{member.cnic}</Detail>
                <Detail label="Gender">{member.gender === "female" ? "Female" : "Male"}</Detail>
                <Detail label="Qualification">{member.qualification}</Detail>
                <Detail label="Employment">{employmentLabels[member.employment]}</Detail>
                <Detail label="Joined">{formatDate(member.joinDate)}</Detail>
                <Detail label="Login">
                  {login ? (
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound aria-hidden className="size-3.5 text-muted-foreground" />
                      {ROLE_LABELS[login.role]}, {login.status === "active" ? "active" : login.status === "invited" ? "invite sent" : "access off"}
                    </span>
                  ) : (
                    "No login"
                  )}
                </Detail>
                <Detail label="Address" className="sm:col-span-2">
                  {member.address}
                </Detail>
              </dl>
            </Card>
            {canSeePay ? (
              <Card className="gap-4 px-5 sm:px-6">
                <div>
                  <CardTitle>
                    <h2>Salary</h2>
                  </CardTitle>
                  <CardDescription className="mt-0.5">Monthly, before tax, EOBI and absences.</CardDescription>
                </div>
                <dl className="text-sm">
                  {[{ label: "Basic salary", amount: member.basicSalary }, ...member.allowances].map((a) => (
                    <div key={a.label} className="flex items-center justify-between border-b border-border py-2">
                      <dt className="text-muted-foreground">{a.label}</dt>
                      <dd className="tabular-nums">{formatRupees(a.amount)}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3">
                    <dt className="font-semibold">Gross</dt>
                    <dd className="text-lg font-semibold tabular-nums">{formatRupees(monthlyGross(member))}</dd>
                  </div>
                </dl>
                {member.bankAccount ? <p className="text-xs text-muted-foreground">Paid to {member.bankAccount}</p> : null}
              </Card>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="teaching">
          <TeachingTab member={member} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab member={member} />
        </TabsContent>
        <TabsContent value="payslips">
          <PayslipsTab member={member} />
        </TabsContent>
      </Tabs>

      {leaving ? <LeftDialog member={member} onClose={() => setLeaving(false)} onDone={(msg) => { setSaved(""); setNotice(msg); }} /> : null}
    </div>
  );
}

function TeachingTab({ member }: { member: StaffMember }) {
  const { data: allocations = [] } = useGetAllocationsQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const mine = allocations.filter((a) => a.teacherId === member.staffId);
  const periods = mine.reduce((n, a) => n + a.weeklyPeriods, 0);
  const incharge = sections.filter((s) => s.inchargeId === member.staffId);
  const placeName = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    return `${classes.find((c) => c.id === section?.classId)?.name ?? ""}, section ${section?.name ?? ""}`;
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Periods a week" value={periods} footer={periods > MAX_WEEKLY_PERIODS ? <Badge variant="warning">Over the {MAX_WEEKLY_PERIODS}-period limit</Badge> : `Limit ${MAX_WEEKLY_PERIODS}`} />
        <StatCard label="Classes taught" value={new Set(mine.map((a) => a.sectionId)).size} footer={`${mine.length} subject allocations`} />
        <StatCard label="Class incharge" value={incharge.length ? incharge.map((s) => placeName(s.id)).join("; ") : "None"} className="col-span-2 lg:col-span-1" />
      </div>
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-base font-semibold">Allocations</h2>
          <Link href="/staff?tab=allocations" className="rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
            Change in Teaching allocations
          </Link>
        </div>
        {mine.length === 0 ? (
          <EmptyState icon={BookOpen} title="No classes assigned" description="Assign subjects in Teaching allocations." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="pr-5 text-right">Periods a week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-5 font-medium">{subjects.find((s) => s.id === a.subjectId)?.name}</TableCell>
                  <TableCell>{placeName(a.sectionId)}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums">{a.weeklyPeriods}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function AttendanceTab({ member }: { member: StaffMember }) {
  const today = useToday();
  const { data: days = [] } = useGetStaffAttendanceQuery();
  const month = (today ?? "2026-10-01").slice(0, 7);
  const mine = days
    .filter((d) => d.branchId === member.branchId && d.date.startsWith(month) && d.marks[member.staffId])
    .sort((a, b) => b.date.localeCompare(a.date));
  const count = (s: string) => mine.filter((d) => d.marks[member.staffId] === s).length;
  const labels = { present: "Present", late: "Late", absent: "Absent", leave: "Leave" } as const;
  const variants = { present: "success", late: "warning", absent: "danger", leave: "info" } as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={count("present")} footer={monthLabel(month)} />
        <StatCard label="Late" value={count("late")} footer="Arrived after the bell" />
        <StatCard label="Absent" value={count("absent")} footer="Deducted from pay" />
        <StatCard label="Leave" value={count("leave")} footer="Approved" />
      </div>
      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">{monthLabel(month)}</h2>
        </div>
        {mine.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance this month yet" description="Mark staff attendance from Attendance, Staff." />
        ) : (
          <ul className="divide-y divide-border">
            {mine.map((d) => {
              const mark = d.marks[member.staffId];
              return (
                <li key={d.id} className="flex items-center justify-between px-5 py-2.5 sm:px-6">
                  <span>{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <Badge variant={variants[mark]}>{labels[mark]}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PayslipsTab({ member }: { member: StaffMember }) {
  const { data: payslips = [] } = useGetPayslipsQuery();
  const mine = payslips.filter((p) => p.staffId === member.staffId).sort((a, b) => b.month.localeCompare(a.month));
  return (
    <Card className="gap-0 py-0">
      <div className="border-b border-border p-5 sm:p-6">
        <h2 className="text-base font-semibold">Payslips</h2>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={Wallet} title="No payslips yet" description="Payslips appear after the month's payroll is run." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Month</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Gross</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Deductions</TableHead>
              <TableHead className="text-right">Net pay</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Print</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-5 font-medium">{monthLabel(p.month)}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatRupees(p.gross)}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatRupees(p.totalDeductions)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatRupees(p.net)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={p.status === "paid" ? "success" : "warning"}>{p.status === "paid" ? "Paid" : "Draft"}</Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label={`Print payslip for ${monthLabel(p.month)}`} onClick={() => window.open(`/print/payslips/${p.id}`, "_blank", "noopener")}>
                    <Printer />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
