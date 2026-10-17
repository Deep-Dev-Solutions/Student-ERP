"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { useBranchClasses, useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { formatRupees } from "@/lib/format";
import {
  errorMessage,
  useGetConcessionsQuery,
  useGetFeeHeadsQuery,
  useGetFeePlansQuery,
  useGetSchoolRulesQuery,
  useRemoveConcessionMutation,
  useRemoveFeeHeadMutation,
  useSaveConcessionMutation,
  useSaveFeeHeadMutation,
  useSaveFeePlanMutation,
} from "@/store/api";
import type { FeeHead } from "@/types";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const frequencyLabels: Record<FeeHead["frequency"], string> = { monthly: "Every month", term: "Some months", one_time: "On admission" };

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

export function FeeStructure() {
  const readOnly = useReadOnly();
  const canEdit = useCan("fin_manage_fees") && !readOnly;
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: heads = [] } = useGetFeeHeadsQuery();
  const { data: plans = [] } = useGetFeePlansQuery();
  const { data: concessions = [] } = useGetConcessionsQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const [saveHead] = useSaveFeeHeadMutation();
  const [removeHead] = useRemoveFeeHeadMutation();
  const [savePlan] = useSaveFeePlanMutation();
  const [saveConcession] = useSaveConcessionMutation();
  const [removeConcession] = useRemoveConcessionMutation();

  // Plan edits, keyed by class then head, until saved.
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [planNotice, setPlanNotice] = useState<{ ok?: string; error?: string }>({});
  const [headName, setHeadName] = useState("");
  const [headFrequency, setHeadFrequency] = useState<FeeHead["frequency"]>("monthly");
  const [headMonths, setHeadMonths] = useState<string[]>([]);
  const [headNotice, setHeadNotice] = useState<{ ok?: string; error?: string }>({});
  const [conName, setConName] = useState("");
  const [conPercent, setConPercent] = useState("");
  const [conNotice, setConNotice] = useState<{ ok?: string; error?: string }>({});

  const planFor = (classId: string) => plans.find((p) => p.classId === classId);
  const cellValue = (classId: string, headId: string) => edits[classId]?.[headId] ?? String(planFor(classId)?.amounts[headId] ?? 0);
  const dirtyClasses = Object.keys(edits);

  const saveAllPlans = async () => {
    for (const classId of dirtyClasses) {
      const plan = planFor(classId);
      const amounts = { ...(plan?.amounts ?? {}) };
      for (const [headId, value] of Object.entries(edits[classId])) amounts[headId] = Number(value || 0);
      const result = await savePlan({ id: plan?.id ?? `plan-${classId}`, branchId: branch?.id ?? "", classId, amounts });
      if ("error" in result) return setPlanNotice({ error: errorMessage(result.error) });
    }
    setEdits({});
    setPlanNotice({ ok: `Fee plans saved for ${dirtyClasses.length} ${dirtyClasses.length === 1 ? "class" : "classes"}. They apply to vouchers generated from now on.` });
  };

  const addHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (headFrequency === "term" && headMonths.length === 0) return setHeadNotice({ error: "Choose the months this fee is charged." });
    const result = await saveHead({
      id: newId("head"),
      name: headName,
      frequency: headFrequency,
      discountable: false,
      ...(headFrequency === "term" ? { termMonths: headMonths } : {}),
    });
    if ("error" in result) return setHeadNotice({ error: errorMessage(result.error) });
    setHeadNotice({ ok: `${result.data.name} added. Set its amount for each class below.` });
    setHeadName("");
    setHeadMonths([]);
  };

  const addConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveConcession({ id: newId("con"), name: conName, percent: Number(conPercent) });
    if ("error" in result) return setConNotice({ error: errorMessage(result.error) });
    setConNotice({ ok: `${result.data.name} added.` });
    setConName("");
    setConPercent("");
  };

  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">Class fee plans</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Amounts per class at {branch?.name}. Tuition is the default for new admissions; each student&apos;s own tuition is used on their voucher.
            </p>
          </div>
          {canEdit ? (
            <Button onClick={saveAllPlans} disabled={dirtyClasses.length === 0}>
              <Save data-icon="inline-start" />
              Save plans
            </Button>
          ) : null}
        </div>
        {planNotice.ok || planNotice.error ? (
          <div className="border-b border-border px-5 py-3 sm:px-6">
            <FormStatus success={planNotice.ok} error={planNotice.error} />
          </div>
        ) : null}
        {/* One column per fee head, so the grid scrolls sideways on narrow screens. */}
        <div data-allow-scroll>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-muted pl-5">Class</TableHead>
                {heads.map((h) => (
                  <TableHead key={h.id} className="min-w-32 text-right">
                    <span className="block text-foreground">{h.name}</span>
                    <span className="block font-normal">
                      {h.frequency === "term" ? (h.termMonths ?? []).map((m) => MONTH_SHORT[Number(m) - 1]).join(", ") : frequencyLabels[h.frequency]}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="min-w-28 pr-5 text-right">Monthly total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => {
                const monthly = heads.filter((h) => h.frequency === "monthly").reduce((n, h) => n + (Number(cellValue(c.id, h.id)) || 0), 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="sticky left-0 z-10 bg-card pl-5 font-medium shadow-[1px_0_0_var(--border)]">{c.name}</TableCell>
                    {heads.map((h) => (
                      <TableCell key={h.id} className="text-right">
                        {canEdit ? (
                          <Input
                            aria-label={`${h.name} for ${c.name}`}
                            inputMode="numeric"
                            value={cellValue(c.id, h.id)}
                            onChange={(e) => {
                              setPlanNotice({});
                              setEdits((prev) => ({ ...prev, [c.id]: { ...prev[c.id], [h.id]: e.target.value.replace(/\D/g, "") } }));
                            }}
                            className="ml-auto h-8 w-24 bg-card text-right tabular-nums"
                          />
                        ) : (
                          <span className="tabular-nums">{formatRupees(Number(cellValue(c.id, h.id)))}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="pr-5 text-right font-medium tabular-nums">{formatRupees(monthly)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-4 px-6">
          <div>
            <CardTitle>
              <h2>Fee heads</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">The charges that can appear on a voucher. Discounts apply to tuition.</CardDescription>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {heads.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div>
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.frequency === "term" ? `In ${(h.termMonths ?? []).map((m) => MONTH_SHORT[Number(m) - 1]).join(" and ")}` : frequencyLabels[h.frequency]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {h.discountable ? <Badge variant="info">Discounts apply</Badge> : null}
                  {canEdit && h.id !== "tuition" ? (
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${h.name}`} onClick={() => removeHead(h.id)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form onSubmit={addHead} noValidate className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField id="head-name" label="New fee head" placeholder="e.g. Transport" value={headName} onChange={(e) => setHeadName(e.target.value)} />
                <SelectField
                  id="head-frequency"
                  label="Charged"
                  options={Object.entries(frequencyLabels).map(([value, label]) => ({ value, label }))}
                  value={headFrequency}
                  onValueChange={(v) => setHeadFrequency(v as FeeHead["frequency"])}
                />
              </div>
              {headFrequency === "term" ? (
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium">Months</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {MONTH_SHORT.map((m, i) => {
                      const mm = String(i + 1).padStart(2, "0");
                      const on = headMonths.includes(mm);
                      return (
                        <button
                          key={mm}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setHeadMonths((prev) => (on ? prev.filter((x) => x !== mm) : [...prev, mm].sort()))}
                          className={`h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${on ? "border-primary bg-secondary font-medium text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <FormStatus success={headNotice.ok} error={headNotice.error} />
                <Button type="submit" variant="outline" disabled={!headName.trim()}>
                  <Plus data-icon="inline-start" />
                  Add fee head
                </Button>
              </div>
            </form>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="gap-4 px-6">
            <div>
              <CardTitle>
                <h2>Concessions</h2>
              </CardTitle>
              <CardDescription className="mt-0.5">Named discounts on tuition, chosen when admitting or editing a student.</CardDescription>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {concessions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="font-medium">{c.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{c.percent}% off</span>
                    {canEdit ? (
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${c.name}`} onClick={() => removeConcession(c.id)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                        <Trash2 />
                      </Button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            {canEdit ? (
              <form onSubmit={addConcession} noValidate className="space-y-3 border-t border-border pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TextField id="con-name" label="New concession" placeholder="e.g. Orphan" wrapperClassName="sm:col-span-2" value={conName} onChange={(e) => setConName(e.target.value)} />
                  <TextField id="con-percent" label="Discount (%)" inputMode="numeric" value={conPercent} onChange={(e) => setConPercent(e.target.value.replace(/\D/g, ""))} />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <FormStatus success={conNotice.ok} error={conNotice.error} />
                  <Button type="submit" variant="outline" disabled={!conName.trim() || !conPercent}>
                    <Plus data-icon="inline-start" />
                    Add concession
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>

          <Card className="gap-3 px-6">
            <CardTitle>
              <h2>Due dates and late fines</h2>
            </CardTitle>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Vouchers due on", rules ? `Day ${rules.fees.dueDay} of the month` : "—"],
                ["Grace period", rules ? `${rules.fees.graceDays} days` : "—"],
                ["Late fine", rules ? `${formatRupees(rules.fees.lateFinePerDay)} a day, up to 30 days` : "—"],
                ["Sibling discount", rules ? `${rules.fees.siblingDiscountPercent}%` : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/settings?tab=rules" className="w-fit rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
              Change in Settings, School rules
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
