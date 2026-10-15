"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { classLabel, sectionLabel, useClassSubjects } from "@/hooks/use-academics";
import {
  errorMessage,
  useChangeSectionMutation,
  useDeleteStudentMutation,
  useGetBranchesQuery,
  useGetClassesQuery,
  useGetSectionsQuery,
  useReadmitStudentMutation,
  useSetElectivesMutation,
  useTransferStudentMutation,
  useUpdateGuardiansMutation,
  useWithdrawStudentMutation,
} from "@/store/api";
import type { Student, Withdrawal } from "@/types";
import { withdrawalReasons } from "../status";
import { GuardiansEditor, validateGuardians } from "./GuardiansEditor";

/** Which action dialog is open, if any. */
export type StudentAction = "section" | "transfer" | "electives" | "withdraw" | "readmit" | "guardians" | "delete";

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Class and section options at one campus, with the section list following the class. */
function usePlacementPicker(branchId: string, initialClassId = "", initialSectionId = "") {
  const { data: classes = [] } = useGetClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const [classId, setClassIdState] = useState(initialClassId);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const branchClasses = classes.filter((c) => c.branchId === branchId).sort((a, b) => a.order - b.order);
  const classSections = sections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name));
  return {
    classId,
    sectionId: classSections.some((s) => s.id === sectionId) ? sectionId : "",
    setClassId: (id: string) => {
      setClassIdState(id);
      setSectionId(sections.filter((s) => s.classId === id).sort((a, b) => a.name.localeCompare(b.name))[0]?.id ?? "");
    },
    setSectionId,
    classOptions: branchClasses.map((c) => ({ value: c.id, label: classLabel(c, true) })),
    sectionOptions: classSections.map((s) => ({ value: s.id, label: `${sectionLabel(s, true)}, ${s.capacity} seats` })),
  };
}

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  error: string | null;
  submitLabel: string;
  submitting: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onSubmit: () => void;
  children?: React.ReactNode;
}

function DialogShell({ open, onOpenChange, title, description, error, submitLabel, submitting, disabled, destructive, onSubmit, children }: DialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={disabled || submitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (message: string) => void;
}

/** Moves one or more students to another class or section at their campus. */
export function ChangeSectionDialog({ students, open, onOpenChange, onDone }: ActionDialogProps & { students: Student[] }) {
  const first = students[0];
  const picker = usePlacementPicker(first?.branchId ?? "", first?.classId, first?.sectionId);
  const [changeSection, { isLoading }] = useChangeSectionMutation();
  const [error, setError] = useState<string | null>(null);
  const many = students.length > 1;

  const submit = async () => {
    if (!picker.classId || !picker.sectionId) return setError("Choose a class and section.");
    const result = await changeSection({ ids: students.map((s) => s.id), classId: picker.classId, sectionId: picker.sectionId });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.(many ? `${students.length} students moved.` : `${first.name} moved.`);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={many ? `Change section for ${students.length} students` : "Change section"}
      description={many ? "Everyone selected moves to the same class and section." : `Move ${first?.name} to another class or section at this campus.`}
      error={error}
      submitLabel="Move"
      submitting={isLoading}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField id="move-class" label="Class" options={picker.classOptions} value={picker.classId} onValueChange={picker.setClassId} placeholder="Choose a class" />
        <SelectField id="move-section" label="Section" options={picker.sectionOptions} value={picker.sectionId} onValueChange={picker.setSectionId} placeholder="Choose a section" />
      </div>
    </DialogShell>
  );
}

export function TransferDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const { data: branches = [] } = useGetBranchesQuery();
  const others = branches.filter((b) => b.id !== student.branchId);
  const [branchId, setBranchId] = useState(others[0]?.id ?? "");
  const picker = usePlacementPicker(branchId);
  const [transfer, { isLoading }] = useTransferStudentMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!branchId || !picker.classId || !picker.sectionId) return setError("Choose a campus, class and section.");
    const result = await transfer({ id: student.id, branchId, classId: picker.classId, sectionId: picker.sectionId });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.(`${student.name} transferred to ${branches.find((b) => b.id === branchId)?.name}.`);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer to another campus"
      description={`${student.name} keeps the same roll ID, fee record and history. Electives are cleared because subjects differ by campus.`}
      error={error}
      submitLabel="Transfer"
      submitting={isLoading}
      disabled={others.length === 0}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id="transfer-branch"
          label="Campus"
          className="sm:col-span-2"
          options={others.map((b) => ({ value: b.id, label: b.name }))}
          value={branchId}
          onValueChange={(v) => {
            setBranchId(v);
            picker.setClassId("");
          }}
          placeholder="No other campus yet"
        />
        <SelectField id="transfer-class" label="Class" options={picker.classOptions} value={picker.classId} onValueChange={picker.setClassId} placeholder="Choose a class" />
        <SelectField id="transfer-section" label="Section" options={picker.sectionOptions} value={picker.sectionId} onValueChange={picker.setSectionId} placeholder="Choose a section" />
      </div>
    </DialogShell>
  );
}

export function ElectivesDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const electives = useClassSubjects(student.classId).filter((s) => s.elective);
  const [chosen, setChosen] = useState<string[]>(student.electiveSubjectIds);
  const [setElectives, { isLoading }] = useSetElectivesMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const result = await setElectives({ id: student.id, subjectIds: chosen });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.("Electives saved.");
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Electives"
      description={`Optional subjects ${student.name} takes. They decide which subject rosters the student appears on.`}
      error={error}
      submitLabel="Save electives"
      submitting={isLoading}
      onSubmit={submit}
    >
      {electives.length === 0 ? (
        <p className="text-sm text-muted-foreground">This class has no electives. Add them in Classes and subjects.</p>
      ) : (
        <div className="grid gap-2">
          {electives.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={chosen.includes(s.id)}
                onCheckedChange={(checked) => setChosen((prev) => (checked ? [...prev, s.id] : prev.filter((x) => x !== s.id)))}
              />
              <span className="text-sm font-medium">{s.name}</span>
            </label>
          ))}
        </div>
      )}
    </DialogShell>
  );
}

export function WithdrawDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const [date, setDate] = useState(todayIso);
  const [reason, setReason] = useState<Withdrawal["reason"]>("transferred");
  const [note, setNote] = useState("");
  const [withdraw, { isLoading }] = useWithdrawStudentMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!date) return setError("Enter the leaving date.");
    if (reason === "other" && !note.trim()) return setError("Add a note explaining the reason.");
    const result = await withdraw({ id: student.id, date, reason, ...(note.trim() ? { note: note.trim() } : {}) });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.(`${student.name} is marked as left. Their record stays available.`);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Mark as left"
      description={`${student.name} stops appearing on registers and fee runs. Their record, fees and results are kept, and they can be re-admitted later.`}
      error={error}
      submitLabel="Mark as left"
      submitting={isLoading}
      destructive
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="withdraw-date" label="Leaving date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <SelectField
          id="withdraw-reason"
          label="Reason"
          options={Object.entries(withdrawalReasons).map(([value, label]) => ({ value, label }))}
          value={reason}
          onValueChange={(v) => setReason(v as Withdrawal["reason"])}
        />
        <TextField id="withdraw-note" label={reason === "other" ? "Note" : "Note (optional)"} wrapperClassName="sm:col-span-2" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {student.balance > 0 ? (
        <p className="rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          Rs {student.balance.toLocaleString("en-US")} is still outstanding. Collect or waive it before issuing a leaving certificate.
        </p>
      ) : null}
    </DialogShell>
  );
}

export function ReadmitDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const picker = usePlacementPicker(student.branchId, student.classId, student.sectionId);
  const [date, setDate] = useState(todayIso);
  const [readmit, { isLoading }] = useReadmitStudentMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!picker.classId || !picker.sectionId) return setError("Choose a class and section.");
    const result = await readmit({ id: student.id, classId: picker.classId, sectionId: picker.sectionId, date });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.(`${student.name} is re-admitted.`);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Re-admit"
      description={`${student.name} returns with the same roll ID and history.`}
      error={error}
      submitLabel="Re-admit"
      submitting={isLoading}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="readmit-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <SelectField id="readmit-class" label="Class" options={picker.classOptions} value={picker.classId} onValueChange={picker.setClassId} placeholder="Choose a class" />
        <SelectField id="readmit-section" label="Section" options={picker.sectionOptions} value={picker.sectionId} onValueChange={picker.setSectionId} placeholder="Choose a section" />
      </div>
    </DialogShell>
  );
}

export function GuardiansDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const [guardians, setGuardians] = useState(student.guardians);
  const [save, { isLoading }] = useUpdateGuardiansMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const problem = validateGuardians(guardians);
    if (problem) return setError(problem);
    const result = await save({ id: student.id, guardians });
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.("Guardians saved.");
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Guardians"
      description="Who the school contacts about fees, attendance and results."
      error={error}
      submitLabel="Save guardians"
      submitting={isLoading}
      onSubmit={submit}
    >
      <GuardiansEditor value={guardians} onChange={setGuardians} idPrefix="dialog-guardian" />
    </DialogShell>
  );
}

export function DeleteStudentDialog({ student, open, onOpenChange, onDone }: ActionDialogProps & { student: Student }) {
  const [typed, setTyped] = useState("");
  const [remove, { isLoading }] = useDeleteStudentMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (typed.trim() !== student.id) return setError(`Type ${student.id} to confirm.`);
    const result = await remove(student.id);
    if ("error" in result) return setError(errorMessage(result.error));
    onOpenChange(false);
    onDone?.(`${student.name}'s record was deleted.`);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this record"
      description="Only for a record entered by mistake. This removes the student, their documents and history, and can't be undone. If the student has left, mark them as left instead."
      error={error}
      submitLabel="Delete record"
      submitting={isLoading}
      destructive
      disabled={typed.trim() !== student.id}
      onSubmit={submit}
    >
      <TextField id="delete-confirm" label={`Type ${student.id} to confirm`} autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
    </DialogShell>
  );
}

/** Renders whichever action dialog is open for a student. Remounts each time so forms start fresh. */
export function StudentActionDialogs({
  student,
  action,
  onClose,
  onDone,
}: {
  student: Student | undefined;
  action: StudentAction | null;
  onClose: () => void;
  onDone?: (message: string) => void;
}) {
  if (!student || !action) return null;
  const props = { open: true, onOpenChange: (open: boolean) => !open && onClose(), onDone };
  const key = `${action}-${student.id}`;
  switch (action) {
    case "section":
      return <ChangeSectionDialog key={key} {...props} students={[student]} />;
    case "transfer":
      return <TransferDialog key={key} {...props} student={student} />;
    case "electives":
      return <ElectivesDialog key={key} {...props} student={student} />;
    case "withdraw":
      return <WithdrawDialog key={key} {...props} student={student} />;
    case "readmit":
      return <ReadmitDialog key={key} {...props} student={student} />;
    case "guardians":
      return <GuardiansDialog key={key} {...props} student={student} />;
    case "delete":
      return <DeleteStudentDialog key={key} {...props} student={student} />;
  }
}
