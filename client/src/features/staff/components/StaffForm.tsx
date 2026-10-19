"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, UserRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { formatRupees } from "@/lib/format";
import { CNIC_PATTERN, maskCnic, maskMobile, MOBILE_PATTERN } from "@/lib/masks";
import { monthlyGross } from "@/lib/payroll";
import { errorMessage, useGetStaffQuery, useSaveStaffMutation } from "@/store/api";
import type { SalaryComponent, StaffMember } from "@/types";
import { localISODate } from "@/lib/dates";

const departments = ["Science", "Mathematics", "Humanities", "IT & CS", "Primary", "Sports", "Administration"];
const employmentOptions = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
];

type Draft = Omit<StaffMember, "id" | "staffId" | "avatar" | "basicSalary"> & { basicSalary: string };

const blank = (branchId: string): Draft => ({
  name: "",
  email: "",
  phone: "",
  role: "",
  department: "Science",
  joinDate: localISODate(),
  status: "active",
  branchId,
  gender: "female",
  cnic: "",
  address: "",
  qualification: "",
  employment: "permanent",
  teaches: true,
  basicSalary: "",
  allowances: [
    { label: "House rent", amount: 0 },
    { label: "Conveyance", amount: 6000 },
    { label: "Medical", amount: 3000 },
  ],
  bankAccount: "",
});

function validate(d: Draft): string | null {
  if (d.name.trim().length < 3) return "Enter the full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return "Enter a valid email address.";
  if (!MOBILE_PATTERN.test(d.phone)) return "The mobile number should look like 0300-1234567.";
  if (d.cnic && !CNIC_PATTERN.test(d.cnic)) return "The CNIC should look like 35202-1234567-1.";
  if (d.role.trim().length < 2) return "Enter the job title.";
  if (!d.joinDate) return "Enter the joining date.";
  const basic = Number(d.basicSalary);
  if (!Number.isInteger(basic) || basic <= 0) return "Enter the basic salary in whole rupees.";
  if (d.allowances.some((a) => !a.label.trim() || !Number.isInteger(a.amount) || a.amount < 0)) return "Each allowance needs a name and an amount.";
  return null;
}

/** Add a staff member (no id) or edit one. */
export function StaffForm({ staffId }: { staffId?: string }) {
  const { data: staff = [] } = useGetStaffQuery();
  const branch = useCurrentBranch();
  const member = staffId ? staff.find((m) => m.id === staffId || m.staffId === staffId) : undefined;
  if (staffId && !member) {
    return (
      <Card className="py-0">
        <EmptyState icon={UserRound} title="We couldn't find this staff member" description="They may have been removed." action={<ButtonLink href="/staff">Back to staff</ButtonLink>} />
      </Card>
    );
  }
  const initial: Draft = member ? { ...member, basicSalary: String(member.basicSalary), cnic: member.cnic ?? "", bankAccount: member.bankAccount ?? "" } : blank(branch?.id ?? "br-1");
  return <Form key={member?.id ?? "new"} initial={initial} existingId={member?.id} staffNumber={member?.staffId} />;
}

function Form({ initial, existingId, staffNumber }: { initial: Draft; existingId?: string; staffNumber?: string }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [save, { isLoading }] = useSaveStaffMutation();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setAllowance = (i: number, changes: Partial<SalaryComponent>) =>
    set("allowances", draft.allowances.map((a, j) => (j === i ? { ...a, ...changes } : a)));
  const basic = Number(draft.basicSalary) || 0;
  const gross = monthlyGross({ basicSalary: basic, allowances: draft.allowances });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(draft);
    if (problem) return setError(problem);
    const result = await save({
      ...draft,
      ...(existingId ? { id: existingId } : {}),
      name: draft.name.trim(),
      email: draft.email.trim().toLowerCase(),
      role: draft.role.trim(),
      basicSalary: basic,
      cnic: draft.cnic || undefined,
      bankAccount: draft.bankAccount?.trim() || undefined,
      allowances: draft.allowances.filter((a) => a.amount > 0),
    });
    if ("error" in result) return setError(errorMessage(result.error));
    router.push(`/staff/${result.data.id}?saved=${existingId ? "1" : "new"}`);
  };

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-4xl space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Personal details</h2>
          </CardTitle>
          {staffNumber ? <CardDescription className="mt-0.5">Staff number {staffNumber}.</CardDescription> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="staff-name" label="Full name" placeholder="e.g. Nadia Hussain" wrapperClassName="sm:col-span-2" value={draft.name} onChange={(e) => set("name", e.target.value)} />
          <SelectField id="staff-gender" label="Gender" options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} value={draft.gender} onValueChange={(v) => set("gender", v as Draft["gender"])} />
          <TextField id="staff-phone" label="Mobile" type="tel" inputMode="numeric" placeholder="0300-1234567" value={draft.phone} onChange={(e) => set("phone", maskMobile(e.target.value))} />
          <TextField id="staff-email" label="Email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          <TextField id="staff-cnic" label="CNIC" inputMode="numeric" placeholder="35202-1234567-1" value={draft.cnic ?? ""} onChange={(e) => set("cnic", maskCnic(e.target.value))} />
          <TextField id="staff-address" label="Address" wrapperClassName="sm:col-span-2 lg:col-span-3" value={draft.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </div>
      </Card>

      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Employment</h2>
          </CardTitle>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="staff-role" label="Job title" placeholder="e.g. Biology Teacher" value={draft.role} onChange={(e) => set("role", e.target.value)} />
          <SelectField id="staff-department" label="Department" options={departments.map((d) => ({ value: d, label: d }))} value={draft.department} onValueChange={(v) => set("department", v)} />
          <SelectField id="staff-employment" label="Employment" options={employmentOptions} value={draft.employment} onValueChange={(v) => set("employment", v as Draft["employment"])} />
          <TextField id="staff-join" label="Joining date" type="date" value={draft.joinDate} onChange={(e) => set("joinDate", e.target.value)} />
          <TextField id="staff-qualification" label="Qualification" placeholder="e.g. MSc Zoology" value={draft.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)} />
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm">
            <Checkbox checked={draft.teaches} onCheckedChange={(c) => set("teaches", c)} />
            Teaches classes
          </label>
        </div>
      </Card>

      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Salary</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Monthly amounts. Tax, EOBI and absences are worked out on each payslip.</CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="staff-basic" label="Basic salary (Rs)" inputMode="numeric" value={draft.basicSalary} onChange={(e) => set("basicSalary", e.target.value.replace(/\D/g, ""))} />
          <TextField id="staff-bank" label="Bank account (IBAN, optional)" placeholder="PK36MEZN0001234567890123" value={draft.bankAccount ?? ""} onChange={(e) => set("bankAccount", e.target.value.toUpperCase())} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Allowances</p>
          <ul className="space-y-2">
            {draft.allowances.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input aria-label={`Allowance ${i + 1} name`} value={a.label} onChange={(e) => setAllowance(i, { label: e.target.value })} className="h-9 flex-1 bg-card" />
                <Input
                  aria-label={`${a.label || `Allowance ${i + 1}`} amount`}
                  inputMode="numeric"
                  value={String(a.amount)}
                  onChange={(e) => setAllowance(i, { amount: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  className="h-9 w-32 bg-card text-right tabular-nums"
                />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${a.label || "allowance"}`} onClick={() => set("allowances", draft.allowances.filter((_, j) => j !== i))} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => set("allowances", [...draft.allowances, { label: "", amount: 0 }])}>
            <Plus data-icon="inline-start" />
            Add allowance
          </Button>
        </div>
        <p className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Gross monthly salary</span>
          <span className="text-base font-semibold tabular-nums">{formatRupees(gross)}</span>
        </p>
      </Card>

      {error ? <FormStatus error={error} /> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href={existingId ? `/staff/${existingId}` : "/staff"} variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={isLoading || readOnly}>
          <Save data-icon="inline-start" />
          {existingId ? "Save changes" : "Add staff member"}
        </Button>
      </div>
    </form>
  );
}
