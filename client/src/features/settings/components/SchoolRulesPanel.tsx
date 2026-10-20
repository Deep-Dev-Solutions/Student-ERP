"use client";

import { useModules } from "@/hooks/use-session";
import { useState } from "react";
import { Clock, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { formatDate } from "@/lib/format";
import { errorMessage, useGetSchoolRulesQuery, useUpdateSchoolRulesMutation } from "@/store/api";
import type { AttendanceMode, SchoolRules } from "@/types";

const modeOptions: { value: AttendanceMode; label: string; hint: string }[] = [
  { value: "class_incharge", label: "Class incharge", hint: "One incharge marks each section once a day." },
  { value: "subject_wise", label: "Subject-wise", hint: "Each subject teacher marks their own lecture; rosters follow subject enrolment." },
  { value: "single_marker", label: "Single marker", hint: "One designated person marks every class." },
  { value: "admin_oversight", label: "Admin oversight", hint: "The office records attendance; teachers don't mark it." },
];

const lockOptions = [
  { value: "0", label: "At the end of the school day" },
  { value: "2", label: "2 hours after marking" },
  { value: "6", label: "6 hours after marking" },
  { value: "24", label: "24 hours after marking" },
];

/** Problems that would stop the rules being saved, or null. */
function validate(rules: SchoolRules): string | null {
  const { fees, grading } = rules;
  if (!Number.isInteger(fees.dueDay) || fees.dueDay < 1 || fees.dueDay > 28) return "The due day must be between 1 and 28.";
  if (fees.lateFinePerDay < 0 || fees.graceDays < 0) return "Late fine and grace days can't be negative.";
  if (fees.siblingDiscountPercent < 0 || fees.siblingDiscountPercent > 100) return "The sibling discount must be between 0 and 100%.";
  if (grading.passPercent < 0 || grading.passPercent > 100) return "The pass mark must be between 0 and 100%.";
  const mins = grading.bands.map((b) => b.min);
  if (grading.bands.some((b) => !b.label.trim())) return "Every grade needs a name.";
  if (mins.some((m, i) => i > 0 && m >= mins[i - 1])) return "Each grade must start below the one above it.";
  if (mins.at(-1) !== 0) return "The lowest grade must start at 0%.";
  return null;
}

export function SchoolRulesPanel() {
  const { data } = useGetSchoolRulesQuery();
  return data ? <SchoolRulesForm initial={data} /> : null;
}

function SchoolRulesForm({ initial }: { initial: SchoolRules }) {
  const { has } = useModules();
  const [rules, setRules] = useState<SchoolRules>(initial);
  const [saveRules, { isLoading }] = useUpdateSchoolRulesMutation();
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");

  const update = <K extends keyof SchoolRules>(section: K, changes: Partial<SchoolRules[K]>) => {
    setRules((prev) => ({ ...prev, [section]: { ...prev[section], ...changes } }));
    setNotice({});
  };
  const num = (value: string) => (value === "" ? 0 : Number(value));

  const addHoliday = () => {
    if (!holidayDate || !holidayName.trim()) return;
    const holidays = [...rules.attendance.holidays, { id: `hol-${holidayDate}`, date: holidayDate, name: holidayName.trim() }]
      .filter((h, i, all) => all.findIndex((x) => x.date === h.date) === i)
      .sort((a, b) => a.date.localeCompare(b.date));
    update("attendance", { holidays });
    setHolidayDate("");
    setHolidayName("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(rules);
    if (problem) return setNotice({ error: problem });
    const result = await saveRules(rules);
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: "School rules saved." });
  };

  const mode = modeOptions.find((m) => m.value === rules.attendance.mode);

  return (
    <form onSubmit={handleSave} noValidate className="space-y-6">
      <Card className="gap-6 px-6">
        <div>
          <CardTitle>
            <h2>School rules</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">How attendance, fees, grades and messages work at every campus.</CardDescription>
        </div>

        {has("attendance") ? (
          <section className="border-t border-border pt-5" aria-labelledby="rules-attendance">
            <h3 id="rules-attendance" className="mb-4 text-sm font-semibold">Attendance</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="rules-mode"
                label="Who marks attendance"
                options={modeOptions}
                value={rules.attendance.mode}
                onValueChange={(v) => update("attendance", { mode: v as AttendanceMode })}
                hint={mode?.hint}
              />
              <SelectField
                id="rules-lock"
                label="Registers lock"
                options={lockOptions}
                value={String(rules.attendance.lockAfterHours)}
                onValueChange={(v) => update("attendance", { lockAfterHours: Number(v) })}
                hint="After that, only a branch admin can change a register, and must give a reason."
              />
            </div>
  
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Holidays</p>
              <p className="mb-3 text-xs text-muted-foreground">No register is expected on these days.</p>
              {rules.attendance.holidays.length > 0 ? (
                <ul className="mb-3 divide-y divide-border rounded-lg border border-border">
                  {rules.attendance.holidays.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span>
                        <span className="font-medium">{h.name}</span>{" "}
                        <span className="text-muted-foreground">{formatDate(h.date)}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => update("attendance", { holidays: rules.attendance.holidays.filter((x) => x.id !== h.id) })}
                        aria-label={`Remove ${h.name}`}
                        className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <TextField id="holiday-date" label="Date" type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} wrapperClassName="sm:w-44" />
                <TextField id="holiday-name" label="Holiday" placeholder="e.g. Eid ul Fitr" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} wrapperClassName="flex-1" />
                <Button type="button" variant="outline" onClick={addHoliday} disabled={!holidayDate || !holidayName.trim()}>
                  <Plus data-icon="inline-start" />
                  Add holiday
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {has("fees") ? (
          <section className="border-t border-border pt-5" aria-labelledby="rules-fees">
            <h3 id="rules-fees" className="mb-4 text-sm font-semibold">Fees</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField id="rules-due" label="Vouchers due on day" type="number" inputMode="numeric" min={1} max={28} value={rules.fees.dueDay} onChange={(e) => update("fees", { dueDay: num(e.target.value) })} hint="Of each month." />
              <TextField id="rules-grace" label="Grace period (days)" type="number" inputMode="numeric" min={0} value={rules.fees.graceDays} onChange={(e) => update("fees", { graceDays: num(e.target.value) })} />
              <TextField id="rules-fine" label="Late fine per day (Rs)" type="number" inputMode="numeric" min={0} value={rules.fees.lateFinePerDay} onChange={(e) => update("fees", { lateFinePerDay: num(e.target.value) })} hint="After the grace period." />
              <TextField id="rules-sibling" label="Sibling discount (%)" type="number" inputMode="numeric" min={0} max={100} value={rules.fees.siblingDiscountPercent} onChange={(e) => update("fees", { siblingDiscountPercent: num(e.target.value) })} hint="For the second child onwards." />
            </div>
          </section>
        ) : null}

        {has("exams") ? (
          <section className="border-t border-border pt-5" aria-labelledby="rules-grading">
            <h3 id="rules-grading" className="mb-4 text-sm font-semibold">Grading</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <TextField id="rules-pass" label="Pass mark (%)" type="number" inputMode="numeric" min={0} max={100} value={rules.grading.passPercent} onChange={(e) => update("grading", { passPercent: num(e.target.value) })} hint="Below this, the grade shows as a fail." />
              <div className="lg:col-span-2">
                <p className="mb-1.5 text-sm font-medium">Grades</p>
                <ul className="space-y-2">
                  {rules.grading.bands.map((band, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Input
                        aria-label={`Grade ${i + 1} name`}
                        value={band.label}
                        maxLength={3}
                        onChange={(e) => update("grading", { bands: rules.grading.bands.map((b, j) => (j === i ? { ...b, label: e.target.value } : b)) })}
                        className="h-9 w-20 bg-card"
                      />
                      <span className="text-sm text-muted-foreground">from</span>
                      <Input
                        aria-label={`Grade ${band.label || i + 1} starts at percent`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        value={band.min}
                        onChange={(e) => update("grading", { bands: rules.grading.bands.map((b, j) => (j === i ? { ...b, min: num(e.target.value) } : b)) })}
                        className="h-9 w-24 bg-card tabular-nums"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-t border-border pt-5" aria-labelledby="rules-notifications">
          <h3 id="rules-notifications" className="mb-4 text-sm font-semibold">Messages to guardians</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ["absenceWhatsApp", "Absence alerts on WhatsApp", "Sent when a register is submitted with absences."],
                ["feeReminderSms", "Fee reminders by SMS", "Sent to guardians of overdue vouchers."],
                ["smsFallback", "SMS when WhatsApp fails", "Each fallback SMS is charged."],
                ["resultsWhatsApp", "Results on WhatsApp", "Sent when a result is locked."],
              ] as const
            ).map(([key, label, hint]) => (
              <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  checked={rules.notifications[key]}
                  onCheckedChange={(checked) => update("notifications", { [key]: checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
          <FormStatus success={notice.ok} error={notice.error} />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Save rules
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}
