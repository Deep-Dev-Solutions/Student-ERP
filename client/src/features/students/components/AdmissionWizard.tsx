"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, PlusCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { classLabel, sectionLabel, useBranchClasses, useClassSubjects, useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { formatDate, formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { errorMessage, useAdmitStudentMutation, useGetConcessionsQuery, useGetFeePlansQuery, useGetSchoolRulesQuery, useGetSectionsQuery, useGetStudentsQuery } from "@/store/api";
import type { Guardian, Student } from "@/types";
import { usePlacement } from "../hooks";
import { relationLabels } from "../status";
import { emptyGuardian, GuardiansEditor, validateGuardians } from "./GuardiansEditor";
import { emptyStudentDetails, fullName, StudentDetailsFields, validateStudentDetails, type StudentDetails } from "./StudentDetailsFields";

const steps = [
  { title: "Student", hint: "Name, birth and B-form" },
  { title: "Guardians", hint: "Contacts and siblings" },
  { title: "Class and fee", hint: "Section and tuition" },
  { title: "Review", hint: "Check and admit" },
];

interface Placement {
  classId: string;
  sectionId: string;
  admissionDate: string;
  monthlyFee: string;
  discountPercent: string;
  electiveSubjectIds: string[];
}

interface Draft {
  details: StudentDetails;
  guardians: Guardian[];
  siblingIds: string[];
  placement: Placement;
  savedAt: string;
}

const DRAFT_KEY = "dd_admission_draft";
const todayIso = () => new Date().toISOString().slice(0, 10);

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
const subscribeNoop = () => () => {};

/** Students who look like this one: same B-form, or same name and date of birth. */
function findDuplicates(details: StudentDetails, students: Student[]) {
  const name = fullName(details).toLowerCase();
  return students.filter(
    (s) => (details.bForm && s.bForm === details.bForm) || (s.name.toLowerCase() === name && s.dateOfBirth === details.dateOfBirth)
  );
}

/** Enrolled students who share a guardian's phone or CNIC. */
function findSiblings(guardians: Guardian[], students: Student[]) {
  const phones = new Set(guardians.map((g) => g.phone).filter((p) => p.length >= 12));
  const cnics = new Set(guardians.map((g) => g.cnic).filter(Boolean));
  return students.filter(
    (s) => s.enrollment === "active" && s.guardians.some((g) => phones.has(g.phone) || (g.cnic && cnics.has(g.cnic)))
  );
}

export function AdmissionWizard() {
  const router = useRouter();
  const branch = useCurrentBranch();
  const readOnly = useReadOnly();
  const classes = useBranchClasses();
  const placementOf = usePlacement();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const [admit, { isLoading }] = useAdmitStudentMutation();
  const { data: plans = [] } = useGetFeePlansQuery();
  const { data: concessions = [] } = useGetConcessionsQuery();
  const planTuition = (classId: string) => String(plans.find((p) => p.classId === classId)?.amounts.tuition ?? 3000);

  const defaultClass = classes.find((c) => c.name === "Class 9") ?? classes[0];
  const firstSection = (classId: string) =>
    sections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name))[0]?.id ?? "";

  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<StudentDetails>(emptyStudentDetails);
  const [guardians, setGuardians] = useState<Guardian[]>(() => [emptyGuardian(true)]);
  const [siblingIds, setSiblingIds] = useState<string[]>([]);
  const [placement, setPlacement] = useState<Placement>(() => ({
    classId: defaultClass?.id ?? "",
    sectionId: defaultClass ? firstSection(defaultClass.id) : "",
    admissionDate: todayIso(),
    monthlyFee: defaultClass ? String(plans.find((p) => p.classId === defaultClass.id)?.amounts.tuition ?? 3000) : "3000",
    discountPercent: "0",
    electiveSubjectIds: [],
  }));
  const [error, setError] = useState<string | null>(null);
  const [duplicateOk, setDuplicateOk] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [draftHandled, setDraftHandled] = useState(false);

  // A saved draft from an earlier visit, read from this browser after hydration.
  const savedDraft = useSyncExternalStore(subscribeNoop, readDraft, () => null);
  const offerDraft = savedDraft && !draftHandled;

  const classSections = sections.filter((s) => s.classId === placement.classId).sort((a, b) => a.name.localeCompare(b.name));
  const electives = useClassSubjects(placement.classId).filter((s) => s.elective);
  const duplicates = findDuplicates(details, students);
  const exactDuplicate = duplicates.find((s) => details.bForm && s.bForm === details.bForm);
  const suggestedSiblings = findSiblings(guardians, students);
  const section = classSections.find((s) => s.id === placement.sectionId);
  const seatsTaken = students.filter((s) => s.sectionId === placement.sectionId && s.enrollment === "active").length;

  const validate = (n: number): string | null => {
    if (n === 1) {
      const problem = validateStudentDetails(details);
      if (problem) return problem;
      if (exactDuplicate) return `A student with this B-form is already enrolled: ${exactDuplicate.name} (${exactDuplicate.id}).`;
      if (duplicates.length && !duplicateOk) return "Check the possible duplicate below before continuing.";
    }
    if (n === 2) return validateGuardians(guardians);
    if (n === 3) {
      if (!placement.classId || !placement.sectionId) return "Choose a class and section.";
      if (!placement.admissionDate) return "Enter the admission date.";
      const fee = Number(placement.monthlyFee);
      if (!Number.isInteger(fee) || fee < 0 || fee > 1_000_000) return "Monthly tuition must be a whole number of rupees.";
      const discount = Number(placement.discountPercent);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) return "The discount must be between 0 and 100%.";
    }
    return null;
  };

  const goTo = (n: number) => {
    if (n > step) {
      for (let i = step; i < n; i++) {
        const problem = validate(i);
        if (problem) {
          setError(problem);
          setStep(i);
          return;
        }
      }
    }
    setError(null);
    // Offer the sibling discount once siblings are linked.
    if (n === 3 && siblingIds.length > 0 && placement.discountPercent === "0" && rules?.fees.siblingDiscountPercent) {
      setPlacement((p) => ({ ...p, discountPercent: String(rules.fees.siblingDiscountPercent) }));
    }
    setStep(n);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const saveDraft = () => {
    try {
      const draft: Draft = { details: { ...details, photoUrl: undefined }, guardians, siblingIds, placement, savedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftNotice("Draft saved on this computer. Open New admission again to continue it.");
    } catch {
      setDraftNotice("This browser didn't allow saving a draft.");
    }
  };

  const restoreDraft = () => {
    if (!savedDraft) return;
    setDetails(savedDraft.details);
    setGuardians(savedDraft.guardians);
    setSiblingIds(savedDraft.siblingIds);
    setPlacement(savedDraft.placement);
    setDraftHandled(true);
    setDraftNotice("Draft restored. Re-attach the photo if there was one.");
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to clear.
    }
    setDraftHandled(true);
  };

  const submit = async () => {
    for (let i = 1; i <= 3; i++) {
      const problem = validate(i);
      if (problem) {
        setStep(i);
        return setError(problem);
      }
    }
    if (!branch) return;
    const result = await admit({
      name: fullName(details),
      email: "",
      ...(details.photoUrl ? { photoUrl: details.photoUrl } : {}),
      ...(details.bForm ? { bForm: details.bForm } : {}),
      dateOfBirth: details.dateOfBirth,
      gender: details.gender,
      ...(details.bloodGroup ? { bloodGroup: details.bloodGroup } : {}),
      religion: details.religion,
      address: details.address.trim(),
      ...(details.previousSchool.trim() ? { previousSchool: details.previousSchool.trim() } : {}),
      admissionDate: placement.admissionDate,
      branchId: branch.id,
      classId: placement.classId,
      sectionId: placement.sectionId,
      electiveSubjectIds: placement.electiveSubjectIds,
      guardians: guardians.map((g) => ({ ...g, name: g.name.trim() })),
      siblingIds,
      monthlyFee: Number(placement.monthlyFee),
      discountPercent: Number(placement.discountPercent),
    });
    if ("error" in result) return setError(errorMessage(result.error));
    discardDraft();
    router.push(`/students/${result.data.id}?admitted=1`);
  };

  const fee = Number(placement.monthlyFee) || 0;
  const discount = Number(placement.discountPercent) || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {offerDraft ? (
        <div className="flex flex-col gap-3 rounded-lg border border-info/30 bg-info-tint p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            You have an unfinished admission{savedDraft.details.firstName ? ` for ${fullName(savedDraft.details)}` : ""}, saved{" "}
            {new Date(savedDraft.savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={discardDraft}>
              Discard
            </Button>
            <Button size="sm" onClick={restoreDraft}>
              Continue draft
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="py-4">
        <ol className="grid grid-cols-4 gap-2 px-4 sm:px-5" aria-label="Steps">
          {steps.map((s, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={s.title} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    state === "todo" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                  )}
                >
                  {state === "done" ? <Check aria-hidden className="size-4" /> : n}
                  {state === "done" ? <span className="sr-only">Step {n}, done</span> : null}
                </span>
                <span className="min-w-0">
                  <span className={cn("hidden truncate text-sm font-medium sm:block", state === "todo" && "text-muted-foreground")}>{s.title}</span>
                  <span className="hidden truncate text-xs text-muted-foreground lg:block">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="px-4 text-sm font-medium sm:hidden">
          Step {step} of {steps.length}: {steps[step - 1].title}
        </p>
      </Card>

      {step === 1 ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Student</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Details as they appear on the B-form.</CardDescription>
          </div>
          <StudentDetailsFields
            value={details}
            onChange={(d) => {
              setDetails(d);
              setDuplicateOk(false);
            }}
          />
          {duplicates.length > 0 && !exactDuplicate ? (
            <div className="space-y-2 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle aria-hidden className="size-4 shrink-0" />
                This might already be enrolled
              </p>
              <ul className="space-y-1">
                {duplicates.map((s) => (
                  <li key={s.id}>
                    <Link href={`/students/${s.id}`} className="font-medium underline">
                      {s.name}, {s.id}
                    </Link>
                    , born {formatDate(s.dateOfBirth)}, {placementOf(s).className}
                  </li>
                ))}
              </ul>
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-foreground">
                <Checkbox checked={duplicateOk} onCheckedChange={(c) => setDuplicateOk(c)} />
                This is a different student
              </label>
            </div>
          ) : null}
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Guardians</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Who the school contacts about fees, attendance and results. Add both parents if you can.</CardDescription>
          </div>
          <GuardiansEditor value={guardians} onChange={setGuardians} />
          {suggestedSiblings.length > 0 ? (
            <section aria-labelledby="siblings-heading" className="rounded-lg border border-border p-4">
              <h3 id="siblings-heading" className="text-sm font-semibold">
                Siblings already at school
              </h3>
              <p className="mt-0.5 mb-3 text-sm text-muted-foreground">These students share a guardian&apos;s phone or CNIC. Link them to give the sibling discount and one family view.</p>
              <ul className="space-y-2">
                {suggestedSiblings.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={siblingIds.includes(s.id)}
                        onCheckedChange={(c) => setSiblingIds((prev) => (c ? [...prev, s.id] : prev.filter((x) => x !== s.id)))}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{s.name}</span>{" "}
                        <span className="text-muted-foreground">
                          {s.id}, {placementOf(s).className}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Class and fee</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Admitting to {branch?.name}.</CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              id="admit-class"
              label="Class"
              options={classes.map((c) => ({ value: c.id, label: classLabel(c, true) }))}
              value={placement.classId}
              onValueChange={(v) => setPlacement((p) => ({ ...p, classId: v, sectionId: firstSection(v), electiveSubjectIds: [], monthlyFee: planTuition(v) }))}
              placeholder="Choose a class"
            />
            <SelectField
              id="admit-section"
              label="Section"
              options={classSections.map((s) => ({ value: s.id, label: sectionLabel(s, true) }))}
              value={placement.sectionId}
              onValueChange={(v) => setPlacement((p) => ({ ...p, sectionId: v }))}
              placeholder="Choose a section"
              hint={section ? `${seatsTaken} of ${section.capacity} seats taken.` : undefined}
            />
            <TextField id="admit-date" label="Admission date" type="date" value={placement.admissionDate} onChange={(e) => setPlacement((p) => ({ ...p, admissionDate: e.target.value }))} />
            <TextField
              id="admit-fee"
              label="Monthly tuition (Rs)"
              inputMode="numeric"
              value={placement.monthlyFee}
              onChange={(e) => setPlacement((p) => ({ ...p, monthlyFee: e.target.value.replace(/\D/g, "") }))}
            />
            <SelectField
              id="admit-concession"
              label="Concession"
              options={[{ value: "none", label: "None" }, ...concessions.map((c) => ({ value: String(c.percent), label: `${c.name}, ${c.percent}%` }))]}
              value={concessions.some((c) => String(c.percent) === placement.discountPercent) ? placement.discountPercent : "none"}
              onValueChange={(v) => setPlacement((p) => ({ ...p, discountPercent: v === "none" ? "0" : v }))}
            />
            <TextField
              id="admit-discount"
              label="Discount (%)"
              inputMode="numeric"
              value={placement.discountPercent}
              onChange={(e) => setPlacement((p) => ({ ...p, discountPercent: e.target.value.replace(/[^\d.]/g, "") }))}
              hint={siblingIds.length > 0 ? `Sibling discount is ${rules?.fees.siblingDiscountPercent ?? 0}% in School rules.` : undefined}
            />
            <div className="flex flex-col justify-end rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Payable each month</span>
              <span className="text-base font-semibold tabular-nums">{formatRupees(Math.round(fee * (1 - discount / 100)))}</span>
            </div>
          </div>
          {section && seatsTaken >= section.capacity ? (
            <p className="rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
              This section is full. You can still admit, or choose a section with free seats.
            </p>
          ) : null}
          {electives.length > 0 ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Electives</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {electives.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={placement.electiveSubjectIds.includes(s.id)}
                      onCheckedChange={(c) =>
                        setPlacement((p) => ({
                          ...p,
                          electiveSubjectIds: c ? [...p.electiveSubjectIds, s.id] : p.electiveSubjectIds.filter((x) => x !== s.id),
                        }))
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Review</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Check the details, then admit. You can edit everything later from the profile.</CardDescription>
          </div>
          <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Student", fullName(details)],
              ["Date of birth", details.dateOfBirth ? formatDate(details.dateOfBirth) : "—"],
              ["B-form", details.bForm || "Not given"],
              ["Main guardian", (() => {
                const g = guardians.find((x) => x.primary);
                return g ? `${g.name} (${relationLabels[g.relation]}), ${g.phone}` : "—";
              })()],
              ["Other guardians", String(guardians.length - 1)],
              ["Siblings linked", siblingIds.length ? students.filter((s) => siblingIds.includes(s.id)).map((s) => s.name).join(", ") : "None"],
              ["Class and section", `${classes.find((c) => c.id === placement.classId)?.name ?? "—"}, ${section ? `section ${section.name}` : "—"}`],
              ["Admission date", placement.admissionDate ? formatDate(placement.admissionDate) : "—"],
              ["Monthly fee", `${formatRupees(Math.round(fee * (1 - discount / 100)))}${discount ? ` after ${discount}% discount` : ""}`],
            ].map(([label, text]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">A roll ID and admission number are given when you admit.</p>
        </Card>
      ) : null}

      {error || draftNotice ? <FormStatus error={error} success={error ? null : draftNotice} /> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={() => goTo(step - 1)} disabled={step === 1}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="ghost" onClick={saveDraft}>
            <Save data-icon="inline-start" />
            Save draft
          </Button>
          {step < steps.length ? (
            <Button onClick={() => goTo(step + 1)}>
              Next: {steps[step].title.toLowerCase()}
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={isLoading || readOnly}>
              <PlusCircle data-icon="inline-start" />
              {isLoading ? "Admitting…" : "Admit student"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
