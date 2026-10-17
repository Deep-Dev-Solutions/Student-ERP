"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronDown,
  FileText,
  History,
  Pencil,
  Printer,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useGrader, useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { useUrlParam, useUrlTab } from "@/hooks/use-url-state";
import { formatDate, formatPercent, formatRupees } from "@/lib/format";
import { statusVariant } from "@/lib/status";
import {
  errorMessage,
  useAddStudentDocumentMutation,
  useGetMarksQuery,
  useGetSectionsQuery,
  useGetStudentActivityQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
  useGetTeachersQuery,
  useGetVouchersQuery,
  useRemoveStudentDocumentMutation,
} from "@/store/api";
import type { Student, StudentDocument } from "@/types";
import { usePlacement } from "../hooks";
import {
  attendanceBreakdown,
  relationLabels,
  studentStatus,
  studentStatusLabels,
  TERM_SCHOOL_DAYS,
  withdrawalReasons,
} from "../status";
import { StudentActionDialogs, type StudentAction } from "./StudentDialogs";

const TABS = ["overview", "attendance", "fees", "results", "documents", "activity"] as const;

const documentKinds: Record<StudentDocument["kind"], string> = {
  b_form: "B-form",
  photo: "Photo",
  leaving_certificate: "Leaving certificate",
  result_card: "Result card",
  other: "Other",
};

const genderLabels: Record<Student["gender"], string> = { male: "Male", female: "Female", other: "Other" };

function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || "—"}</dd>
    </div>
  );
}

function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          {description ? <CardDescription className="mt-0.5">{description}</CardDescription> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function StudentProfile({ studentId }: { studentId: string }) {
  const { data: students = [] } = useGetStudentsQuery();
  const student = students.find((s) => s.id === studentId);
  const placement = usePlacement();
  const [activeTab, setActiveTab] = useUrlTab("overview", TABS);
  const [admitted, setAdmitted] = useUrlParam("admitted", "");
  const [saved, setSaved] = useUrlParam("saved", "");
  const [action, setAction] = useState<StudentAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canEdit = useCan("adm_edit_student");
  const readOnly = useReadOnly();
  const canManage = canEdit && !readOnly;

  if (!student) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={UserRound}
          title="We couldn't find this student"
          description="The roll ID may be wrong, or the record was deleted."
          action={<ButtonLink href="/students">Back to students</ButtonLink>}
        />
      </Card>
    );
  }

  const where = placement(student);
  const status = studentStatus(student);
  const withdrawn = student.enrollment === "withdrawn";
  const open = (a: StudentAction) => setAction(a);
  const message = admitted === "1" ? `Admission saved. ${student.name}'s roll ID is ${student.id}.` : saved === "1" ? "Changes saved." : notice;

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        meta={<Badge variant={statusVariant(status)}>{studentStatusLabels[status]}</Badge>}
        description={`Roll ID ${student.id}, admission no. ${student.admissionNo}. ${where.className}, section ${where.sectionName}, ${where.branchName}.`}
        actions={
          <>
            <ButtonLink href={`/print/students/${student.id}`} variant="outline" target="_blank">
              <Printer data-icon="inline-start" />
              Print admission form
            </ButtonLink>
            {canManage ? (
              <>
                <ButtonLink href={`/students/${student.id}/edit`} variant="outline">
                  <Pencil data-icon="inline-start" />
                  Edit
                </ButtonLink>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button />}>
                    More actions
                    <ChevronDown data-icon="inline-end" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuGroup>
                      {!withdrawn ? (
                        <>
                          <DropdownMenuItem onClick={() => open("section")}>
                            <ArrowLeftRight className="text-muted-foreground" />
                            Change section
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => open("transfer")}>
                            <Building2 className="text-muted-foreground" />
                            Transfer to another campus
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => open("electives")}>
                            <BookOpen className="text-muted-foreground" />
                            Electives
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      <DropdownMenuItem onClick={() => open("guardians")}>
                        <UsersRound className="text-muted-foreground" />
                        Guardians
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {withdrawn ? (
                      <DropdownMenuItem onClick={() => open("readmit")}>
                        <RotateCcw />
                        Re-admit
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem variant="destructive" onClick={() => open("withdraw")}>
                        <ShieldAlert />
                        Mark as left
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => open("delete")}>
                      <Trash2 />
                      Delete record
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </>
        }
      />

      {message ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success-tint p-3">
          <FormStatus success={message} />
          {admitted === "1" || saved === "1" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdmitted("");
                setSaved("");
              }}
            >
              Dismiss
            </Button>
          ) : null}
        </div>
      ) : null}

      {withdrawn && student.withdrawal ? (
        <p role="status" className="rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          Left school on {formatDate(student.withdrawal.date)}: {withdrawalReasons[student.withdrawal.reason].toLowerCase()}
          {student.withdrawal.note ? `. ${student.withdrawal.note}` : "."}
        </p>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <UserRound />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarCheck />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees">
            <Wallet />
            Fees
          </TabsTrigger>
          <TabsTrigger value="results">
            <BookOpen />
            Results
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText />
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab student={student} canManage={canManage} onAction={open} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab student={student} />
        </TabsContent>
        <TabsContent value="fees">
          <FeesTab student={student} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab student={student} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab student={student} canManage={canManage} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab student={student} />
        </TabsContent>
      </Tabs>

      <StudentActionDialogs
        student={student}
        action={action}
        onClose={() => setAction(null)}
        onDone={(text) => {
          setAdmitted("");
          setSaved("");
          setNotice(text);
        }}
      />
    </div>
  );
}

function OverviewTab({ student, canManage, onAction }: { student: Student; canManage: boolean; onAction: (a: StudentAction) => void }) {
  const placement = usePlacement();
  const where = placement(student);
  const { data: students = [] } = useGetStudentsQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const incharge = teachers.find((t) => t.id === sections.find((s) => s.id === student.sectionId)?.inchargeId);
  const electives = subjects.filter((s) => student.electiveSubjectIds.includes(s.id)).map((s) => s.name);
  const siblings = students.filter((s) => student.siblingIds.includes(s.id));
  const feeAfterDiscount = Math.round(student.monthlyFee * (1 - student.discountPercent / 100));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Student">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Date of birth">{formatDate(student.dateOfBirth)}</Detail>
          <Detail label="Gender">{genderLabels[student.gender]}</Detail>
          <Detail label="B-form number">{student.bForm}</Detail>
          <Detail label="Blood group">{student.bloodGroup}</Detail>
          <Detail label="Religion">{student.religion}</Detail>
          <Detail label="Admitted on">{formatDate(student.admissionDate)}</Detail>
          <Detail label="Address" className="sm:col-span-2">
            {student.address}
          </Detail>
          <Detail label="Previous school">{student.previousSchool}</Detail>
        </dl>
      </SectionCard>

      <SectionCard title="Class and fee">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Campus">{where.branchName}</Detail>
          <Detail label="Class and section">
            {where.className}, section {where.sectionName}
          </Detail>
          <Detail label="Class incharge">{incharge?.name ?? "Not assigned"}</Detail>
          <Detail label="Electives">{electives.length ? electives.join(", ") : "None"}</Detail>
          <Detail label="Monthly tuition">{formatRupees(student.monthlyFee)}</Detail>
          <Detail label="After discount">
            {formatRupees(feeAfterDiscount)}
            {student.discountPercent ? <span className="font-normal text-muted-foreground"> ({student.discountPercent}% off)</span> : null}
          </Detail>
        </dl>
      </SectionCard>

      <SectionCard
        title="Guardians"
        description="Fees and alerts go to the main guardian."
        action={
          canManage ? (
            <Button variant="outline" size="sm" onClick={() => onAction("guardians")}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          ) : null
        }
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {student.guardians.map((g) => (
            <li key={g.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {g.name}{" "}
                  <span className="font-normal text-muted-foreground">{relationLabels[g.relation]}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {g.phone}
                  {g.cnic ? `, CNIC ${g.cnic}` : ""}
                  {g.occupation ? `, ${g.occupation}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.primary ? <Badge variant="info">Main guardian</Badge> : null}
                {g.whatsapp ? <Badge variant="success">WhatsApp alerts</Badge> : null}
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Siblings" description="Students who share a guardian. Sibling discounts follow School rules.">
        {siblings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No siblings at this school.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {siblings.map((s) => {
              const p = placement(s);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <Link
                      href={`/students/${s.id}`}
                      className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {s.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {s.id}, {p.className}, section {p.sectionName}
                    </p>
                  </div>
                  <Badge variant={statusVariant(studentStatus(s))}>{studentStatusLabels[studentStatus(s)]}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function AttendanceTab({ student }: { student: Student }) {
  const days = attendanceBreakdown(student);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Attendance this term" value={formatPercent(student.attendance)} footer={`${TERM_SCHOOL_DAYS} school days so far`} />
        <StatCard label="Present" value={days.present} footer="Days" />
        <StatCard label="Absent" value={days.absent} footer="Days without leave" />
        <StatCard label="Approved leave" value={days.leave} footer="Days" />
      </div>
      <Card className="py-0">
        <EmptyState
          icon={CalendarCheck}
          title="Day-by-day history"
          description="Each day's mark appears here once registers for this term are saved."
        />
      </Card>
    </div>
  );
}

function FeesTab({ student }: { student: Student }) {
  const { data: vouchers = [] } = useGetVouchersQuery();
  const mine = vouchers.filter((v) => v.studentId === student.id);
  const fee = Math.round(student.monthlyFee * (1 - student.discountPercent / 100));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Monthly fee" value={formatRupees(fee)} footer={student.discountPercent ? `${student.discountPercent}% discount applied` : "No discount"} />
        <StatCard
          label="Outstanding"
          value={formatRupees(student.balance)}
          footer={student.balance > 0 ? <Badge variant={statusVariant(student.feeStatus)}>{studentStatusLabels[studentStatus(student)]}</Badge> : "Nothing due"}
        />
        <StatCard label="Vouchers this session" value={mine.length} footer={`${mine.filter((v) => v.status === "paid").length} paid`} className="col-span-2 lg:col-span-1" />
      </div>
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">Vouchers</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Monthly vouchers and what was paid.</p>
          </div>
          <ButtonLink href={`/fees?find=${student.id}`} variant="outline" size="sm">
            <Wallet data-icon="inline-start" />
            Collect a fee
          </ButtonLink>
        </div>
        {mine.length === 0 ? (
          <EmptyState icon={Wallet} title="No vouchers yet" description="Vouchers appear here once the month's fees are generated." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Month</TableHead>
                <TableHead className="hidden lg:table-cell">Voucher</TableHead>
                <TableHead className="hidden xl:table-cell">Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-5 font-medium">{v.month}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{v.voucherNumber}</TableCell>
                  <TableCell className="hidden xl:table-cell">{v.dueDate}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupees(v.totalAmount)}</TableCell>
                  <TableCell className="pr-5">
                    <Badge variant={statusVariant(v.status)}>{v.status === "partial" ? "Partly paid" : v.status[0].toUpperCase() + v.status.slice(1)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function ResultsTab({ student }: { student: Student }) {
  const { data: marks = [] } = useGetMarksQuery();
  const grade = useGrader();
  const mine = marks.filter((m) => m.studentId === student.id && m.obtainedMarks !== "");

  return (
    <Card className="gap-0 py-0">
      <div className="border-b border-border p-5 sm:p-6">
        <h2 className="text-base font-semibold">Results</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Marks entered for this session.</p>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={BookOpen} title="No results yet" description="Marks appear here once teachers enter them for an exam." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Exam and subject</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Percent</TableHead>
              <TableHead className="pr-5 text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((m) => {
              const pct = Math.round((Number(m.obtainedMarks) / m.maxMarks) * 100);
              const g = grade(pct);
              return (
                <TableRow key={m.id}>
                  <TableCell className="pl-5">
                    <p className="font-medium">Mid-term exam 2026</p>
                    <p className="text-xs text-muted-foreground">Physics</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {m.obtainedMarks} / {m.maxMarks}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pct}%</TableCell>
                  <TableCell className="pr-5 text-center">
                    <Badge variant={g.variant}>{g.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function DocumentsTab({ student, canManage }: { student: Student; canManage: boolean }) {
  const [addDocument, addState] = useAddStudentDocumentMutation();
  const [removeDocument] = useRemoveStudentDocumentMutation();
  const [kind, setKind] = useState<StudentDocument["kind"]>("b_form");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setNotice({ error: "Choose a file to upload." });
    if (file.size > 5 * 1024 * 1024) return setNotice({ error: "Files can be up to 5 MB." });
    const result = await addDocument({
      id: student.id,
      document: { name: name.trim() || documentKinds[kind], kind, fileName: file.name, sizeKb: Math.ceil(file.size / 1024) },
    });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `${file.name} added.` });
    setName("");
    setFile(null);
    setFileKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Add a document</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">B-form, photo, previous result card or leaving certificate. PDF, JPG or PNG up to 5 MB.</CardDescription>
          </div>
          <form onSubmit={upload} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField
                id="doc-kind"
                label="Type"
                options={Object.entries(documentKinds).map(([value, label]) => ({ value, label }))}
                value={kind}
                onValueChange={(v) => setKind(v as StudentDocument["kind"])}
              />
              <TextField id="doc-name" label="Name (optional)" placeholder={documentKinds[kind]} value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <label htmlFor="doc-file" className="mb-1.5 block text-sm font-medium">
                  File
                </label>
                <input
                  key={fileKey}
                  id="doc-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:text-sm file:font-medium file:text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormStatus success={notice.ok} error={notice.error} />
              <Button type="submit" disabled={!file || addState.isLoading}>
                <Upload data-icon="inline-start" />
                Add document
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Documents</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{student.documents.length} on file.</p>
        </div>
        {student.documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" description="Add the B-form and previous result card when you have them." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Document</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="pl-5 whitespace-normal">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs break-all text-muted-foreground">
                      {d.fileName}, {d.sizeKb} KB
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{documentKinds[d.kind]}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(d.uploadedAt)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDocument({ id: student.id, documentId: d.id })}
                        aria-label={`Remove ${d.name}`}
                        className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function ActivityTab({ student }: { student: Student }) {
  const { data: activity = [] } = useGetStudentActivityQuery();
  const mine = activity.filter((a) => a.studentId === student.id).sort((a, b) => b.at.localeCompare(a.at));
  const when = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>Activity</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">Changes to this record, newest first, with who made them.</CardDescription>
      </div>
      {mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {mine.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <History aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.actor}, {when(a.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
