"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField } from "@/components/shared/FormFields";
import { useUrlParam } from "@/hooks/use-url-state";
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { MAX_WEEKLY_PERIODS } from "@/lib/payroll";
import {
  errorMessage,
  useGetAllocationsQuery,
  useGetClassSubjectsQuery,
  useGetSectionsQuery,
  useGetStaffQuery,
  useGetSubjectsQuery,
  useSetAllocationMutation,
} from "@/store/api";

const NONE = "none";

export function TeacherAllocations() {
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: allocations = [] } = useGetAllocationsQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const { data: allSections = [] } = useGetSectionsQuery();
  const [setAllocation] = useSetAllocationMutation();
  const readOnly = useReadOnly();
  const canEdit = useCan("acad_manage_allocations") && !readOnly;
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});

  // Open on the class with the most allocations, so the grid starts where the timetable work is.
  const defaultClass =
    [...classes].sort((a, b) => allocations.filter((x) => x.classId === b.id).length - allocations.filter((x) => x.classId === a.id).length)[0]?.id ?? "";
  const [classParam, setClassParam] = useUrlParam("class", "");
  const classId = classes.some((c) => c.id === classParam) ? classParam : defaultClass;
  const chosenClass = classes.find((c) => c.id === classId);

  const branchStaff = staff.filter((m) => m.branchId === branch?.id);
  const teachers = branchStaff.filter((m) => m.teaches && m.status !== "terminated");
  const teacherItems = [{ value: NONE, label: "Unassigned" }, ...teachers.map((t) => ({ value: t.staffId, label: t.status === "on_leave" ? `${t.name} (on leave)` : t.name }))];
  const sections = allSections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name));
  const rows = classSubjects
    .filter((cs) => cs.classId === classId)
    .map((cs) => ({ ...cs, subject: subjects.find((s) => s.id === cs.subjectId) }))
    .sort((a, b) => (a.subject?.name ?? "").localeCompare(b.subject?.name ?? ""));
  const cell = (sectionId: string, subjectId: string) => allocations.find((a) => a.sectionId === sectionId && a.subjectId === subjectId);
  const unassigned = rows.reduce((n, r) => n + sections.filter((s) => !cell(s.id, r.subjectId)).length, 0);

  const branchSectionIds = new Set(allSections.filter((s) => classes.some((c) => c.id === s.classId)).map((s) => s.id));
  const branchAllocations = allocations.filter((a) => branchSectionIds.has(a.sectionId));
  const load = teachers
    .map((t) => {
      const mine = branchAllocations.filter((a) => a.teacherId === t.staffId);
      return { teacher: t, periods: mine.reduce((n, a) => n + a.weeklyPeriods, 0), classes: new Set(mine.map((a) => a.sectionId)).size };
    })
    .sort((a, b) => b.periods - a.periods);
  const onLeave = load.filter((l) => l.teacher.status === "on_leave" && l.periods > 0);
  const overloaded = load.filter((l) => l.periods > MAX_WEEKLY_PERIODS);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "";
  const save = async (sectionId: string, subjectId: string, teacherId: string | null, weeklyPeriods?: number) => {
    const section = sections.find((s) => s.id === sectionId);
    const result = await setAllocation({ classId, sectionId, subjectId, teacherId, weeklyPeriods });
    const where = `${subjectName(subjectId)}, ${chosenClass?.name} section ${section?.name}`;
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    const teacher = teachers.find((t) => t.staffId === teacherId);
    setNotice({ success: !teacherId ? `${where} is now unassigned.` : weeklyPeriods !== undefined ? `${where} set to ${weeklyPeriods} periods a week.` : `${teacher?.name} now teaches ${where}.` });
  };

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>
              <h2>Who teaches what</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">
              Pick a teacher for each subject and section{canEdit ? "; changes save straight away" : ""}.
            </CardDescription>
          </div>
          <SelectField
            id="alloc-class"
            label="Class"
            className="sm:w-56"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={classId}
            onValueChange={(v) => {
              setClassParam(v);
              setNotice({});
            }}
          />
        </div>

        {unassigned > 0 || onLeave.length > 0 ? (
          <ul className="space-y-2 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
            {unassigned > 0 ? (
              <li className="flex items-start gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {unassigned} {unassigned === 1 ? "subject has" : "subjects have"} no teacher in {chosenClass?.name}.
              </li>
            ) : null}
            {onLeave.map((l) => (
              <li key={l.teacher.id} className="flex items-start gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {l.teacher.name} is on leave but still has {l.periods} periods a week. Arrange cover or reassign.
              </li>
            ))}
          </ul>
        ) : null}

        {rows.length === 0 || sections.length === 0 ? (
          <EmptyState icon={Layers} title="Nothing to allocate yet" description="Add sections and subjects to this class in Academics first." />
        ) : (
          <div data-allow-scroll className="-mx-5 sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-6">Subject</TableHead>
                  {sections.map((s) => (
                    <TableHead key={s.id} className="last:pr-5 sm:last:pr-6">
                      Section {s.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 font-medium sm:pl-6">
                      {r.subject?.name}
                      {r.elective ? <span className="block text-xs font-normal text-muted-foreground">Elective</span> : null}
                    </TableCell>
                    {sections.map((s) => {
                      const a = cell(s.id, r.subjectId);
                      const where = `${r.subject?.name}, section ${s.name}`;
                      return (
                        <TableCell key={s.id} className="last:pr-5 sm:last:pr-6">
                          <div className="flex items-center gap-2">
                            <Select
                              items={teacherItems}
                              value={a?.teacherId ?? NONE}
                              disabled={!canEdit}
                              onValueChange={(v) => v && v !== (a?.teacherId ?? NONE) && save(s.id, r.subjectId, v === NONE ? null : v)}
                            >
                              <SelectTrigger aria-label={`Teacher for ${where}`} className={`h-9 w-44 bg-card ${a ? "" : "text-muted-foreground"}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teacherItems.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {a ? (
                              <Input
                                key={`${a.id}-${a.weeklyPeriods}`}
                                aria-label={`Periods a week for ${where}`}
                                title="Periods a week"
                                inputMode="numeric"
                                defaultValue={String(a.weeklyPeriods)}
                                disabled={!canEdit}
                                onBlur={(e) => {
                                  const n = Number(e.target.value);
                                  if (n !== a.weeklyPeriods) save(s.id, r.subjectId, a.teacherId, n);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                                className="h-9 w-14 bg-card text-center tabular-nums"
                              />
                            ) : null}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <FormStatus success={notice.success} error={notice.error} idle={canEdit ? "The small box next to each teacher is periods a week." : "Only school admins can change allocations."} />
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Teaching load</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Periods a week across all classes at this campus. Above {MAX_WEEKLY_PERIODS} is flagged.
            {overloaded.length ? ` ${overloaded.length} over the limit.` : ""}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Teacher</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead className="hidden text-right md:table-cell">Sections</TableHead>
              <TableHead className="pr-5 text-right">Periods a week</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {load.map(({ teacher, periods, classes: count }) => (
              <TableRow key={teacher.id}>
                <TableCell className="pl-5">
                  <Link href={`/staff/${teacher.id}?tab=teaching`} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                    {teacher.name}
                  </Link>
                  {teacher.status === "on_leave" ? (
                    <Badge variant="info" className="ml-2">
                      On leave
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{teacher.department}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{count}</TableCell>
                <TableCell className="pr-5 text-right">
                  <span className="inline-flex items-center gap-2">
                    {periods > MAX_WEEKLY_PERIODS ? <Badge variant="warning">Over limit</Badge> : periods === 0 ? <Badge variant="outline">No classes</Badge> : null}
                    <span className="tabular-nums">{periods}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
