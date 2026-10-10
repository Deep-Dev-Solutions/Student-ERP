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

const inputClass =
  "h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const selectTriggerClass =
  "h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium";

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
        className="block text-xs font-semibold text-slate-700 mb-1.5"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] text-rose-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      )}
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
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Admission submitted successfully.
        </div>
      )}

      {/* Step 1: Student Personal Information */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs ring-1 ring-blue-500/10">
            01
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 1: Student Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Basic demographic, official legal name, and biological details.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="firstName" label="First Name" required error={errors.firstName?.message}>
            <Input
              placeholder="e.g. Ahmed"
              className={inputClass}
              {...a11y("firstName")}
              {...register("firstName")}
            />
          </Field>

          <Field id="lastName" label="Last Name" required error={errors.lastName?.message}>
            <Input
              placeholder="e.g. Khan"
              className={inputClass}
              {...a11y("lastName")}
              {...register("lastName")}
            />
          </Field>

          <Field id="dateOfBirth" label="Date of Birth" required error={errors.dateOfBirth?.message}>
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
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("gender")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="bloodGroup" label="Blood Group" error={errors.bloodGroup?.message}>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("bloodGroup")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_pos">A+</SelectItem>
                    <SelectItem value="b_pos">B+</SelectItem>
                    <SelectItem value="o_pos">O+</SelectItem>
                    <SelectItem value="ab_pos">AB+</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="previousSchool" label="Previous School" error={errors.previousSchool?.message}>
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
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs ring-1 ring-indigo-500/10">
            02
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 2: Guardian & Emergency Contacts
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Parental identification and automated WhatsApp fee/attendance notification channel.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="guardianName" label="Father / Guardian Name" required error={errors.guardianName?.message}>
            <Input
              placeholder="e.g. Muhammad Raza Khan"
              className={inputClass}
              {...a11y("guardianName")}
              {...register("guardianName")}
            />
          </Field>

          <Field id="guardianCnic" label="Guardian CNIC / National ID" error={errors.guardianCnic?.message}>
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
            label="WhatsApp Alert Number"
            required
            error={errors.whatsappNumber?.message}
            hint="Automated attendance notifications will be sent to this WhatsApp."
          >
            <Input
              type="tel"
              placeholder="0300-XXXXXXX"
              className={inputClass}
              {...a11y("whatsappNumber")}
              {...register("whatsappNumber")}
            />
          </Field>

          <Field id="emergencyPhone" label="Emergency Secondary Phone" error={errors.emergencyPhone?.message}>
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
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs ring-1 ring-emerald-500/10">
            03
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 3: Academic Assignment & Fee Structure
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Grade placement, section allocation, and monthly tuition dues.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="enrollingClass" label="Enrolling Class" required error={errors.enrollingClass?.message}>
            <Controller
              name="enrollingClass"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("enrollingClass")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Class 9 (Matric)</SelectItem>
                    <SelectItem value="10">Class 10 (Matric)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="section" label="Section Allocation" required error={errors.section?.message}>
            <Controller
              name="section"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger className={selectTriggerClass} {...a11y("section")} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Section A (Morning)</SelectItem>
                    <SelectItem value="b">Section B (Morning)</SelectItem>
                    <SelectItem value="c">Section C (Evening)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field id="monthlyFee" label="Monthly Tuition Fee (PKR)" required error={errors.monthlyFee?.message}>
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
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSaveDraft?.(getValues())}
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-10 px-5 shadow-xs"
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-10 px-6 shadow-xs"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit & Print Admission Challan"}
        </Button>
      </div>
    </form>
  );
}
