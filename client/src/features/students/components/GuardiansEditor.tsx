"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField, TextField } from "@/components/shared/FormFields";
import { CNIC_PATTERN, maskCnic, maskMobile, MOBILE_PATTERN } from "@/lib/masks";
import type { Guardian } from "@/types";
import { relationLabels } from "../status";

const relationOptions = Object.entries(relationLabels).map(([value, label]) => ({ value, label }));

export const emptyGuardian = (primary: boolean): Guardian => ({
  id: `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  name: "",
  relation: primary ? "father" : "mother",
  phone: "",
  whatsapp: primary,
  primary,
});

/** The first problem with a guardian list, or null when it can be saved. */
export function validateGuardians(guardians: Guardian[]): string | null {
  if (guardians.length === 0) return "Add at least one guardian.";
  for (const [i, g] of guardians.entries()) {
    const who = guardians.length > 1 ? `Guardian ${i + 1}` : "The guardian";
    if (g.name.trim().length < 3) return `${who} needs a full name.`;
    if (!MOBILE_PATTERN.test(g.phone)) return `${who}'s mobile number should look like 0300-1234567.`;
    if (g.cnic && !CNIC_PATTERN.test(g.cnic)) return `${who}'s CNIC should look like 35201-1234567-1.`;
  }
  if (guardians.filter((g) => g.primary).length !== 1) return "Choose one main guardian.";
  if (!guardians.some((g) => g.whatsapp)) return "Tick WhatsApp for at least one guardian so alerts can reach the family.";
  return null;
}

interface GuardiansEditorProps {
  value: Guardian[];
  onChange: (guardians: Guardian[]) => void;
  /** Prefix for field ids, so two editors can share a page. */
  idPrefix?: string;
}

export function GuardiansEditor({ value, onChange, idPrefix = "guardian" }: GuardiansEditorProps) {
  const update = (id: string, changes: Partial<Guardian>) =>
    onChange(value.map((g) => (g.id === id ? { ...g, ...changes } : changes.primary ? { ...g, primary: false } : g)));

  const remove = (id: string) => {
    const rest = value.filter((g) => g.id !== id);
    if (rest.length && !rest.some((g) => g.primary)) rest[0] = { ...rest[0], primary: true };
    onChange(rest);
  };

  return (
    <div className="space-y-4">
      {value.map((g, i) => {
        const id = `${idPrefix}-${i}`;
        return (
          <fieldset key={g.id} className="rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium">
              {g.primary ? "Main guardian" : `Guardian ${i + 1}`}
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField id={`${id}-name`} label="Full name" placeholder="e.g. Muhammad Raza Khan" value={g.name} onChange={(e) => update(g.id, { name: e.target.value })} />
              <SelectField id={`${id}-relation`} label="Relation" options={relationOptions} value={g.relation} onValueChange={(v) => update(g.id, { relation: v as Guardian["relation"] })} />
              <TextField
                id={`${id}-phone`}
                label="Mobile"
                type="tel"
                inputMode="numeric"
                placeholder="0300-1234567"
                value={g.phone}
                onChange={(e) => update(g.id, { phone: maskMobile(e.target.value) })}
              />
              <TextField
                id={`${id}-cnic`}
                label="CNIC (optional)"
                inputMode="numeric"
                placeholder="35201-1234567-1"
                value={g.cnic ?? ""}
                onChange={(e) => update(g.id, { cnic: maskCnic(e.target.value) || undefined })}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={g.whatsapp} onCheckedChange={(checked) => update(g.id, { whatsapp: checked })} />
                  Send alerts on WhatsApp
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={g.primary} disabled={g.primary} onCheckedChange={(checked) => checked && update(g.id, { primary: true })} />
                  Main guardian for fees and alerts
                </label>
              </div>
              {value.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(g.id)} className="self-start text-muted-foreground hover:bg-danger-tint hover:text-danger">
                  <Trash2 data-icon="inline-start" />
                  Remove
                </Button>
              ) : null}
            </div>
          </fieldset>
        );
      })}
      {value.length < 4 ? (
        <Button type="button" variant="outline" onClick={() => onChange([...value, emptyGuardian(value.length === 0)])}>
          <Plus data-icon="inline-start" />
          Add another guardian
        </Button>
      ) : null}
    </div>
  );
}
