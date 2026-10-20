"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { maskMobile } from "@/lib/masks";
import { errorMessage, useCreateTenantMutation } from "@/store/api";
import type { ModuleKey } from "@/types";
import { ModulePicker } from "./shared";

export function NewSchool() {
  const router = useRouter();
  const [create, { isLoading }] = useCreateTenantMutation();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"trial" | "active">("trial");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [owner, setOwner] = useState({ name: "", email: "", phone: "" });
  const [modules, setModules] = useState<ModuleKey[]>(["students"]);
  const [seats, setSeats] = useState("200");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create({
      name,
      city,
      status,
      modules,
      studentSeats: Number(seats) || 0,
      firstBranch: { name: branchName || name, code: branchCode },
      owner,
    });
    if ("error" in result) return setError(errorMessage(result.error));
    router.push(`/console/${result.data.id}?created=1`);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader title="Add a school" description="Create the school, its first campus and the owner's login, and choose the modules it gets." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-5 px-5 sm:px-6">
          <CardTitle>
            <h2>School</h2>
          </CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="school-name" label="School name" placeholder="e.g. Al-Huda Grammar School" wrapperClassName="sm:col-span-2" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField id="school-city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <SelectField id="school-status" label="Start as" options={[{ value: "trial", label: "Trial" }, { value: "active", label: "Active (paid)" }]} value={status} onValueChange={(v) => setStatus(v as "trial" | "active")} />
            <TextField id="branch-name" label="First campus name" placeholder="Defaults to the school name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            <TextField id="branch-code" label="Campus code" placeholder="e.g. AHG" value={branchCode} onChange={(e) => setBranchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} />
          </div>
        </Card>
        <Card className="gap-5 px-5 sm:px-6">
          <div>
            <CardTitle>
              <h2>Owner</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">They get a sign-in link and can add the rest of their staff.</CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="owner-name" label="Full name" wrapperClassName="sm:col-span-2" value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} />
            <TextField id="owner-email" label="Email" type="email" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
            <TextField id="owner-phone" label="Mobile" type="tel" inputMode="numeric" placeholder="0300-1234567" value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: maskMobile(e.target.value) })} />
          </div>
        </Card>
      </div>
      <Card className="gap-5 px-5 sm:px-6">
        <div>
          <CardTitle>
            <h2>Modules</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">The school sees only the modules switched on. Dashboard and Settings are always included.</CardDescription>
        </div>
        <ModulePicker idPrefix="new" value={modules} onChange={setModules} onNote={setNote} />
        {note ? <p className="text-sm text-muted-foreground" role="status">{note}</p> : null}
        {modules.includes("students") ? (
          <TextField id="school-seats" label="Student seats" inputMode="numeric" wrapperClassName="sm:w-48" hint="Most active students allowed." value={seats} onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))} />
        ) : null}
      </Card>
      {error ? <FormStatus error={error} /> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href="/console" variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={isLoading}>
          <Save data-icon="inline-start" />
          Create school
        </Button>
      </div>
    </form>
  );
}
