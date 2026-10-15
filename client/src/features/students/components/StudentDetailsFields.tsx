"use client";

import { ImageIcon, Upload, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/shared/FormFields";
import { CNIC_PATTERN, maskCnic } from "@/lib/masks";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

/** The student's own details, shared by the admission wizard and the edit page. */
export interface StudentDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bForm: string;
  bloodGroup: string;
  religion: string;
  address: string;
  previousSchool: string;
  photoUrl?: string;
  photoName?: string;
}

export const emptyStudentDetails: StudentDetails = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "male",
  bForm: "",
  bloodGroup: "",
  religion: "Islam",
  address: "",
  previousSchool: "",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const bloodGroupOptions = [
  { value: "", label: "Not known" },
  ...["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => ({ value: g, label: g })),
];
const religionOptions = ["Islam", "Christianity", "Hinduism", "Sikhism", "Other"].map((r) => ({ value: r, label: r }));

/** The first problem with the details, or null. */
export function validateStudentDetails(d: StudentDetails): string | null {
  if (d.firstName.trim().length < 2) return "Enter the student's first name.";
  if (d.lastName.trim().length < 2) return "Enter the student's last name.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) return "Enter the date of birth.";
  const age = (Date.now() - new Date(d.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 2.5 || age > 22) return "Check the date of birth: the student should be between 3 and 22 years old.";
  if (d.bForm && !CNIC_PATTERN.test(d.bForm)) return "The B-form number should look like 35202-1234567-1.";
  if (d.address.trim().length < 5) return "Enter the home address.";
  return null;
}

export const fullName = (d: Pick<StudentDetails, "firstName" | "lastName">) => `${d.firstName.trim()} ${d.lastName.trim()}`.trim();

interface StudentDetailsFieldsProps {
  value: StudentDetails;
  onChange: (value: StudentDetails) => void;
}

export function StudentDetailsFields({ value, onChange }: StudentDetailsFieldsProps) {
  const set = <K extends keyof StudentDetails>(key: K, v: StudentDetails[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <section aria-labelledby="student-photo-heading">
        <h3 id="student-photo-heading" className="mb-2 text-sm font-medium">
          Photo
        </h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
            {value.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local preview, not an optimisable asset
              <img src={value.photoUrl} alt="Photo preview" className="size-full object-cover" />
            ) : value.photoName ? (
              <ImageIcon aria-hidden className="size-8" />
            ) : (
              <UserRound aria-hidden className="size-8" />
            )}
          </span>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="student-photo" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                <Upload data-icon="inline-start" />
                {value.photoUrl ? "Change photo" : "Upload photo"}
              </label>
              <input
                id="student-photo"
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onChange({ ...value, photoUrl: URL.createObjectURL(file), photoName: file.name });
                }}
              />
              {value.photoUrl ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, photoUrl: undefined, photoName: undefined })}>
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">A passport-size photo, JPG or PNG. Used on the ID card and admission form.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField id="student-first" label="First name" placeholder="e.g. Ahmed" autoComplete="off" value={value.firstName} onChange={(e) => set("firstName", e.target.value)} />
        <TextField id="student-last" label="Last name" placeholder="e.g. Khan" autoComplete="off" value={value.lastName} onChange={(e) => set("lastName", e.target.value)} />
        <TextField id="student-dob" label="Date of birth" type="date" value={value.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        <SelectField id="student-gender" label="Gender" options={genderOptions} value={value.gender} onValueChange={(v) => set("gender", v as Gender)} />
        <TextField
          id="student-bform"
          label="B-form number"
          inputMode="numeric"
          placeholder="35202-1234567-1"
          hint="From the NADRA child registration certificate. Used to catch duplicate admissions."
          value={value.bForm}
          onChange={(e) => set("bForm", maskCnic(e.target.value))}
        />
        <SelectField id="student-blood" label="Blood group" options={bloodGroupOptions} value={value.bloodGroup} onValueChange={(v) => set("bloodGroup", v)} />
        <SelectField id="student-religion" label="Religion" options={religionOptions} value={value.religion} onValueChange={(v) => set("religion", v)} />
        <TextField id="student-previous" label="Previous school (optional)" placeholder="e.g. City Grammar School" value={value.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} />
        <TextField id="student-address" label="Home address" placeholder="House, street, area, city" wrapperClassName="sm:col-span-2 lg:col-span-3" value={value.address} onChange={(e) => set("address", e.target.value)} />
      </div>
    </div>
  );
}
