"use client";

import { Fragment, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { CurrentBranchName } from "@/components/layout/CurrentBranchName";
import { classLabel, useBranchClasses } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import {
  errorMessage,
  useAddClassMutation,
  useAddSectionMutation,
  useGetSectionsQuery,
  useGetTeachersQuery,
  useRemoveClassMutation,
  useRemoveSectionMutation,
  useUpdateSectionMutation,
} from "@/store/api";
import type { Section } from "@/types";

const NO_INCHARGE = "none";
const shiftOptions = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
];

export function ClassesPanel() {
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: allSections = [] } = useGetSectionsQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const [addClass, addClassState] = useAddClassMutation();
  const [removeClass] = useRemoveClassMutation();
  const [addSection, addSectionState] = useAddSectionMutation();
  const [updateSection] = useUpdateSectionMutation();
  const [removeSection] = useRemoveSectionMutation();

  const [className, setClassName] = useState("");
  const [stage, setStage] = useState("");
  const [classNotice, setClassNotice] = useState<{ ok?: string; error?: string }>({});

  const [sectionClassId, setSectionClassId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [shift, setShift] = useState<Section["shift"]>("morning");
  const [capacity, setCapacity] = useState("40");
  const [inchargeId, setInchargeId] = useState(NO_INCHARGE);
  const [sectionNotice, setSectionNotice] = useState<{ ok?: string; error?: string }>({});
  const [tableError, setTableError] = useState<string | null>(null);

  const sectionsOf = (classId: string) =>
    allSections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name));
  const sectionCount = classes.reduce((n, c) => n + sectionsOf(c.id).length, 0);
  const seats = classes.reduce((n, c) => n + sectionsOf(c.id).reduce((m, s) => m + s.capacity, 0), 0);

  const classOptions = classes.map((c) => ({ value: c.id, label: classLabel(c, true) }));
  const inchargeOptions = [
    { value: NO_INCHARGE, label: "No incharge yet" },
    ...teachers.map((t) => ({ value: t.id, label: t.name })),
  ];
  const teacherName = (id?: string) => teachers.find((t) => t.id === id)?.name;

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || !className.trim()) return;
    const name = className.trim();
    const order = Number(name.match(/\d+/)?.[0] ?? classes.length + 1);
    const result = await addClass({ branchId: branch.id, name, order, ...(stage.trim() ? { stage: stage.trim() } : {}) });
    if ("error" in result) return setClassNotice({ error: errorMessage(result.error) });
    setClassNotice({ ok: `${name} added. Add its sections next.` });
    setSectionClassId(result.data.id);
    setClassName("");
    setStage("");
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const seatsNumber = Number(capacity);
    if (!sectionClassId || !sectionName.trim()) return;
    if (!Number.isInteger(seatsNumber) || seatsNumber < 1) return setSectionNotice({ error: "Capacity must be a whole number of seats." });
    const name = sectionName.trim().toUpperCase();
    const result = await addSection({
      classId: sectionClassId,
      name,
      shift,
      capacity: seatsNumber,
      ...(inchargeId !== NO_INCHARGE ? { inchargeId } : {}),
    });
    if ("error" in result) return setSectionNotice({ error: errorMessage(result.error) });
    const cls = classes.find((c) => c.id === sectionClassId);
    setSectionNotice({ ok: `Section ${name} added to ${cls?.name ?? "the class"}.` });
    setSectionName("");
    setInchargeId(NO_INCHARGE);
  };

  const handleRemoveClass = async (classId: string) => {
    const result = await removeClass(classId);
    setTableError("error" in result ? errorMessage(result.error) : null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="gap-5 px-6 lg:col-span-2">
          <div>
            <CardTitle>
              <h2>Add a class</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">A grade taught at this campus, such as Class 6.</CardDescription>
          </div>
          <form onSubmit={handleAddClass} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField id="class-name" label="Class name" placeholder="e.g. Class 6" value={className} onChange={(e) => setClassName(e.target.value)} />
              <TextField id="class-stage" label="Stage (optional)" placeholder="e.g. Matric" value={stage} onChange={(e) => setStage(e.target.value)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormStatus success={classNotice.ok} error={classNotice.error} />
              <Button type="submit" disabled={!className.trim() || addClassState.isLoading}>
                <Plus data-icon="inline-start" />
                Add class
              </Button>
            </div>
          </form>
        </Card>

        <Card className="gap-5 px-6 lg:col-span-3">
          <div>
            <CardTitle>
              <h2>Add a section</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Each section has its own register, capacity and class incharge.</CardDescription>
          </div>
          <form onSubmit={handleAddSection} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField id="section-class" label="Class" options={classOptions} value={sectionClassId} onValueChange={setSectionClassId} placeholder="Choose a class" />
              <TextField id="section-name" label="Section" placeholder="e.g. D" maxLength={3} value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
              <SelectField id="section-shift" label="Shift" options={shiftOptions} value={shift} onValueChange={(v) => setShift(v as Section["shift"])} />
              <TextField id="section-capacity" label="Capacity" type="number" inputMode="numeric" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              <SelectField id="section-incharge" label="Class incharge" options={inchargeOptions} value={inchargeId} onValueChange={setInchargeId} className="sm:col-span-2" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormStatus success={sectionNotice.ok} error={sectionNotice.error} />
              <Button type="submit" disabled={!sectionClassId || !sectionName.trim() || addSectionState.isLoading}>
                <Plus data-icon="inline-start" />
                Add section
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-1 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">
              Classes at <CurrentBranchName />
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {classes.length} classes, {sectionCount} sections, {seats.toLocaleString("en-US")} seats.
            </p>
          </div>
          {tableError ? <FormStatus error={tableError} /> : null}
        </div>

        {classes.length === 0 ? (
          <EmptyState icon={Layers} title="No classes at this campus yet" description="Add a class above, then add its sections." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Section</TableHead>
                <TableHead className="hidden lg:table-cell">Shift</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Capacity</TableHead>
                <TableHead>Class incharge</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => {
                const sections = sectionsOf(cls.id);
                return (
                  <Fragment key={cls.id}>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableCell colSpan={4} className="pl-5">
                        <span className="font-semibold">{classLabel(cls, true)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {sections.length === 1 ? "1 section" : `${sections.length} sections`}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        {sections.length === 0 ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveClass(cls.id)}
                            aria-label={`Remove ${cls.name}`}
                            className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {sections.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-5 whitespace-normal">
                          <p className="font-medium">
                            {cls.name}, section {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize lg:hidden">
                            {s.shift}, {s.capacity} seats
                          </p>
                        </TableCell>
                        <TableCell className="hidden capitalize lg:table-cell">{s.shift}</TableCell>
                        <TableCell className="hidden text-right tabular-nums lg:table-cell">{s.capacity}</TableCell>
                        <TableCell>
                          <Select
                            items={inchargeOptions}
                            value={s.inchargeId ?? NO_INCHARGE}
                            onValueChange={(v) => v && updateSection({ id: s.id, inchargeId: v === NO_INCHARGE ? undefined : v })}
                          >
                            <SelectTrigger
                              aria-label={`Class incharge for ${cls.name}, section ${s.name}`}
                              className="h-8 w-36 bg-card sm:w-48"
                            >
                              <SelectValue>{teacherName(s.inchargeId) ?? "No incharge yet"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {inchargeOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeSection(s.id)}
                            aria-label={`Remove ${cls.name}, section ${s.name}`}
                            className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
