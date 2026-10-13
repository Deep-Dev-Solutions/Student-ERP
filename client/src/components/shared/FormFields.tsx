"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/*
 * Labelled fields for admin forms, matching the markup the existing forms use
 * (Teaching allocations, Exam setup, Campus profile).
 */

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

function FieldShell({ id, label, hint, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface TextFieldProps extends Omit<React.ComponentProps<typeof Input>, "id"> {
  id: string;
  label: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextField({ id, label, hint, wrapperClassName, className, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} className={wrapperClassName}>
      <Input id={id} className={cn("h-9 bg-card", className)} {...inputProps} />
    </FieldShell>
  );
}

export interface FieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  options: FieldOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({ id, label, options, value, onValueChange, placeholder, hint, disabled, className }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <Select items={options} value={value} onValueChange={(v) => v !== null && onValueChange(v)} disabled={disabled}>
        <SelectTrigger id={id} className="h-9 w-full bg-card">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** The one-line result under a form: what was saved, or what went wrong. */
export function FormStatus({ success, error, idle }: { success?: string | null; error?: string | null; idle?: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {error ? (
        <span className="flex items-center gap-2 text-danger">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          {error}
        </span>
      ) : success ? (
        <span className="flex items-center gap-2 text-success">
          <CheckCircle2 aria-hidden className="size-4 shrink-0" />
          {success}
        </span>
      ) : (
        idle
      )}
    </p>
  );
}
