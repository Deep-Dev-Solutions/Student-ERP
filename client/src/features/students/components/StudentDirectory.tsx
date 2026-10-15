"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  MoreVertical,
  Users,
  Phone,
  ShieldAlert,
  CreditCard,
  MessageSquare,
  ArrowLeftRight,
  Download,
  Pencil,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus } from "@/components/shared/FormFields";
import { SelectionBar, SortableHead, TablePagination } from "@/components/shared/DataTableParts";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { downloadFile } from "@/lib/csv";
import { formatPercent } from "@/lib/format";
import { statusVariant } from "@/lib/status";
import type { Student } from "@/types";
import { primaryGuardian, studentStatus, studentStatusLabels } from "../status";
import { genderFilterOptions, statusFilterOptions, studentsCsv, useStudentDirectory } from "../useStudentDirectory";
import { StudentProfileDrawer } from "./StudentProfileDrawer";
import { ChangeSectionDialog, StudentActionDialogs, type StudentAction } from "./StudentDialogs";

/** wa.me link for a Pakistani mobile number. */
const whatsappLink = (phone: string) => `https://wa.me/92${phone.replace(/\D/g, "").replace(/^0/, "")}`;

export function StudentDirectory() {
  const { atCampus, view, table, isFiltered, classes, sections, filters, placement } = useStudentDirectory();
  const canEdit = useCan("adm_edit_student");
  const readOnly = useReadOnly();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMove, setBulkMove] = useState(false);
  const [action, setAction] = useState<{ type: StudentAction; student: Student } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const classOptions = [{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))];
  const sectionOptions = [{ value: "all", label: "All sections" }, ...sections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))];
  const pageIds = view.rows.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someOnPage = pageIds.some((id) => selectedIds.includes(id));
  const selectedStudents = atCampus.filter((s) => selectedIds.includes(s.id));
  const canManage = canEdit && !readOnly;

  const toggleRow = (id: string, checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  const togglePage = (checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...new Set([...prev, ...pageIds])] : prev.filter((id) => !pageIds.includes(id))));

  const filterSelects = [
    { label: "Filter by class", items: classOptions, value: filters.classFilter, set: filters.setClassFilter, width: "w-36" },
    ...(filters.classFilter !== "all"
      ? [{ label: "Filter by section", items: sectionOptions, value: filters.sectionFilter, set: filters.setSectionFilter, width: "w-36" }]
      : []),
    { label: "Filter by gender", items: genderFilterOptions, value: filters.genderFilter, set: filters.setGenderFilter, width: "w-32" },
    { label: "Filter by status", items: statusFilterOptions, value: filters.statusFilter, set: filters.setStatusFilter, width: "w-40" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1 lg:max-w-md">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={filters.query}
              onChange={(e) => filters.setQuery(e.target.value)}
              placeholder="Name, roll ID, admission no., father or phone"
              aria-label="Search students"
              className="h-9 bg-card pl-9"
            />
          </div>

          {filterSelects.map((f) => (
            <Select key={f.label} items={f.items} value={f.value} onValueChange={(v) => v && f.set(v)}>
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

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {view.total} of {atCampus.length} students
        </p>
      </div>

      {notice ? <FormStatus success={notice} /> : null}

      <SelectionBar count={selectedIds.length} noun="student" onClear={() => setSelectedIds([])}>
        {canManage ? (
          <Button variant="outline" size="sm" onClick={() => setBulkMove(true)}>
            <ArrowLeftRight data-icon="inline-start" />
            Change section
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadFile(`students-selected-${selectedIds.length}.csv`, studentsCsv(selectedStudents, placement))}
        >
          <Download data-icon="inline-start" />
          Export selected
        </Button>
      </SelectionBar>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {view.total === 0 ? (
          <EmptyState
            icon={Users}
            title={isFiltered ? "No students match these filters" : "No students at this campus yet"}
            description={isFiltered ? "Try a different name or roll ID, or clear the filters to see everyone." : "Admit a student or import a spreadsheet to get started."}
            action={
              isFiltered ? (
                <Button variant="outline" onClick={filters.clear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pl-5">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={someOnPage && !allOnPage}
                      onCheckedChange={(checked) => togglePage(checked)}
                      aria-label="Select all students on this page"
                    />
                  </TableHead>
                  <SortableHead label="Roll ID" column="id" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="hidden lg:table-cell" />
                  <SortableHead label="Student" column="name" sort={table.sort} dir={table.dir} onSort={table.toggleSort} />
                  <SortableHead label="Class" column="class" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="hidden sm:table-cell" />
                  <TableHead className="hidden xl:table-cell">Guardian</TableHead>
                  <SortableHead label="Attendance" column="attendance" sort={table.sort} dir={table.dir} onSort={table.toggleSort} className="hidden xl:table-cell" />
                  <SortableHead label="Status" column="status" sort={table.sort} dir={table.dir} onSort={table.toggleSort} />
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {view.rows.map((student) => {
                  const where = placement(student);
                  const guardian = primaryGuardian(student);
                  const status = studentStatus(student);
                  const checked = selectedIds.includes(student.id);
                  return (
                    <TableRow
                      key={student.id}
                      data-state={checked ? "selected" : undefined}
                      className="group cursor-pointer"
                      onClick={() => openProfile(student)}
                    >
                      <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={checked} onCheckedChange={(c) => toggleRow(student.id, c)} aria-label={`Select ${student.name}`} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{student.id}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="hidden size-9 shrink-0 sm:flex items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                          >
                            {student.avatar}
                          </span>
                          <div className="flex flex-col">
                            {/* The name is the keyboard entry point to the quick view. */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProfile(student);
                              }}
                              className="w-fit rounded text-left font-medium text-foreground outline-none group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                            >
                              {student.name}
                            </button>
                            <span className="text-xs text-muted-foreground">{student.admissionNo}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span>{where.className}</span>
                          <span className="text-xs text-muted-foreground">{where.sectionLabel}</span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-col">
                          <span>{guardian?.name ?? "—"}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone aria-hidden className="size-3" />
                            {guardian?.phone ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${student.attendance >= 90 ? "bg-success" : "bg-warning"}`}
                              style={{ width: formatPercent(student.attendance) }}
                            />
                          </div>
                          <span className="font-medium">{formatPercent(student.attendance)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusVariant(status)}>{studentStatusLabels[status]}</Badge>
                      </TableCell>

                      <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${student.name}`}>
                                <MoreVertical />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>{student.id}</DropdownMenuLabel>
                              <DropdownMenuItem render={<Link href={`/students/${student.id}`} />}>
                                <UserRound className="text-muted-foreground" />
                                Open profile
                              </DropdownMenuItem>
                              {canManage ? (
                                <>
                                  <DropdownMenuItem render={<Link href={`/students/${student.id}/edit`} />}>
                                    <Pencil className="text-muted-foreground" />
                                    Edit details
                                  </DropdownMenuItem>
                                  {status !== "withdrawn" ? (
                                    <DropdownMenuItem onClick={() => setAction({ type: "section", student })}>
                                      <ArrowLeftRight className="text-muted-foreground" />
                                      Change section
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              ) : null}
                              <DropdownMenuItem render={<Link href={`/fees?find=${student.id}`} />}>
                                <CreditCard className="text-muted-foreground" />
                                Collect fee
                              </DropdownMenuItem>
                              {guardian ? (
                                <DropdownMenuItem render={<a href={whatsappLink(guardian.phone)} target="_blank" rel="noopener noreferrer" />}>
                                  <MessageSquare className="text-muted-foreground" />
                                  Message guardian on WhatsApp
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuGroup>
                            {canManage ? (
                              <>
                                <DropdownMenuSeparator />
                                {status === "withdrawn" ? (
                                  <DropdownMenuItem onClick={() => setAction({ type: "readmit", student })}>
                                    <RotateCcw />
                                    Re-admit
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem variant="destructive" onClick={() => setAction({ type: "withdraw", student })}>
                                    <ShieldAlert />
                                    Mark as left
                                  </DropdownMenuItem>
                                )}
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={view.page}
              pageCount={view.pageCount}
              total={view.total}
              pageSize={table.pageSize}
              noun="students"
              onPage={table.setPage}
            />
          </>
        )}
      </div>

      <StudentProfileDrawer
        student={selectedStudent ? (atCampus.find((s) => s.id === selectedStudent.id) ?? selectedStudent) : null}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <StudentActionDialogs
        student={action?.student}
        action={action?.type ?? null}
        onClose={() => setAction(null)}
        onDone={setNotice}
      />

      {bulkMove ? (
        <ChangeSectionDialog
          students={selectedStudents}
          open
          onOpenChange={(open) => !open && setBulkMove(false)}
          onDone={(message) => {
            setNotice(message);
            setSelectedIds([]);
          }}
        />
      ) : null}
    </div>
  );
}
