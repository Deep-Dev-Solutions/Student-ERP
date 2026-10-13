"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, PlusCircle } from "lucide-react";
import {
  admissionDefaults,
  admissionSchema,
  type AdmissionFormInput,
  type AdmissionFormValues,
} from "../schemas/admission";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const bloodGroupOptions = [
  { value: "a_pos", label: "A+" },
  { value: "b_pos", label: "B+" },
  { value: "o_pos", label: "O+" },
  { value: "ab_pos", label: "AB+" },
  { value: "other", label: "Other" },
];

const classOptions = [
  { value: "9", label: "Class 9 (Matric)" },
  { value: "10", label: "Class 10 (Matric)" },
];

const sectionOptions = [
  { value: "a", label: "Section A (morning)" },
  { value: "b", label: "Section B (morning)" },
  { value: "c", label: "Section C (evening)" },
];

const inputClass = "h-9 bg-card";
const selectTriggerClass = "h-9 w-full bg-card";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium"
      >
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}*
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function SectionHeader({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
      >
        {step}
      </span>
      <div>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>
          <span className="sr-only">Step {step} of 3. </span>
          {description}
        </CardDescription>
      </div>
    </div>
  );
}

interface AdmissionFormProps {
  onSubmit?: (values: AdmissionFormValues) => void | Promise<void>;
  onSaveDraft?: (values: AdmissionFormInput) => void;
}

export function AdmissionForm({ onSubmit, onSaveDraft }: AdmissionFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionFormInput, unknown, AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: admissionDefaults,
    mode: "onTouched",
  });

  const submit = handleSubmit(async (values) => {
    // TODO: replace with the admissions API call once the data layer exists.
    await onSubmit?.(values);
    setSubmitted(true);
    reset(admissionDefaults);
  });

  const a11y = (name: keyof AdmissionFormInput) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-4xl space-y-6">
      {submitted && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint px-4 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 aria-hidden className="size-4" />
          Admission submitted.
        </div>
      )}

      {/* Step 1: Student Personal Information */}
      <Card className="gap-5 px-6">
        <SectionHeader step={1} title="Student" description="Legal name, date of birth and background." />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="firstName" label="First name" required error={errors.firstName?.message}>
            <Input
              placeholder="e.g. Ahmed"
              className={inputClass}
              {...a11y("firstName")}
              {...register("firstName")}
            />
          </Field>

          <Field id="lastName" label="Last name" required error={errors.lastName?.message}>
            <Input
              placeholder="e.g. Khan"
              className={inputClass}
              {...a11y("lastName")}
              {...register("lastName")}
            />
          </Field>

          <Field id="dateOfBirth" label="Date of birth" required error={errors.dateOfBirth?.message}>
            <Input
              type="date"
              className={inputClass}
              {...a11y("dateOfBirth")}
              {...register("dateOfBirth")}
            />
          </Field>

          <Field id="gender" label="Gender" required error={errors.gender?.message}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select items={genderOptions} value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("gender")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="bloodGroup" label="Blood group" error={errors.bloodGroup?.message}>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => (
                <Select items={bloodGroupOptions} value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("bloodGroup")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroupOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="previousSchool" label="Previous school" error={errors.previousSchool?.message}>
            <Input
              placeholder="e.g. City Grammar School"
              className={inputClass}
              {...a11y("previousSchool")}
              {...register("previousSchool")}
            />
          </Field>
        </div>
      </Card>

      {/* Step 2: Guardian Details */}
      <Card className="gap-5 px-6">
        <SectionHeader step={2} title="Guardian and emergency contacts" description="Who we contact about fees and attendance, including WhatsApp alerts." />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="guardianName" label="Father or guardian name" required error={errors.guardianName?.message}>
            <Input
              placeholder="e.g. Muhammad Raza Khan"
              className={inputClass}
              {...a11y("guardianName")}
              {...register("guardianName")}
            />
          </Field>

          <Field id="guardianCnic" label="Guardian CNIC" error={errors.guardianCnic?.message}>
            <Input
              placeholder="35201-XXXXXXX-X"
              inputMode="numeric"
              className={inputClass}
              {...a11y("guardianCnic")}
              {...register("guardianCnic")}
            />
          </Field>

          <Field
            id="whatsappNumber"
            label="WhatsApp number for alerts"
            required
            error={errors.whatsappNumber?.message}
            hint="Absence and fee alerts are sent to this number."
          >
            <Input
              type="tel"
              placeholder="0300-XXXXXXX"
              className={inputClass}
              {...a11y("whatsappNumber")}
              {...register("whatsappNumber")}
            />
          </Field>

          <Field id="emergencyPhone" label="Emergency phone" error={errors.emergencyPhone?.message}>
            <Input
              type="tel"
              placeholder="0321-XXXXXXX"
              className={inputClass}
              {...a11y("emergencyPhone")}
              {...register("emergencyPhone")}
            />
          </Field>
        </div>
      </Card>

      {/* Step 3: Academic Assignment & Fee Structure */}
      <Card className="gap-5 px-6">
        <SectionHeader step={3} title="Class and fee" description="Class, section and monthly tuition." />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="enrollingClass" label="Class" required error={errors.enrollingClass?.message}>
            <Controller
              name="enrollingClass"
              control={control}
              render={({ field }) => (
                <Select items={classOptions} value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("enrollingClass")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="section" label="Section" required error={errors.section?.message}>
            <Controller
              name="section"
              control={control}
              render={({ field }) => (
                <Select items={sectionOptions} value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("section")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="monthlyFee" label="Monthly tuition (Rs)" required error={errors.monthlyFee?.message}>
            <Input
              inputMode="numeric"
              placeholder="3,000"
              className={inputClass}
              {...a11y("monthlyFee")}
              {...register("monthlyFee")}
            />
          </Field>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSaveDraft?.(getValues())}
          size="lg"
        >
          Save draft
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
        >
          <PlusCircle data-icon="inline-start" />
          {isSubmitting ? "Submitting…" : "Submit admission"}
        </Button>
      </div>
    </form>
  );
}
