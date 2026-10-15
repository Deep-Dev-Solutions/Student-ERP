"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { useReadOnly } from "@/hooks/use-academics";
import { formatRupees } from "@/lib/format";
import { errorMessage, useGetStudentsQuery, useUpdateStudentMutation } from "@/store/api";
import type { Guardian, Student } from "@/types";
import { GuardiansEditor, validateGuardians } from "./GuardiansEditor";
import { fullName, StudentDetailsFields, validateStudentDetails, type StudentDetails } from "./StudentDetailsFields";

function toDetails(s: Student): StudentDetails {
  const [firstName, ...rest] = s.name.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    bForm: s.bForm ?? "",
    bloodGroup: s.bloodGroup ?? "",
    religion: s.religion ?? "Islam",
    address: s.address,
    previousSchool: s.previousSchool ?? "",
    photoUrl: s.photoUrl,
  };
}

export function StudentEditForm({ studentId }: { studentId: string }) {
  const { data: students = [] } = useGetStudentsQuery();
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={UserRound}
          title="We couldn't find this student"
          description="The roll ID may be wrong, or the record was deleted."
          action={<ButtonLink href="/students">Back to students</ButtonLink>}
        />
      </Card>
    );
  }
  return <EditForm key={student.id} student={student} />;
}

function EditForm({ student }: { student: Student }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [details, setDetails] = useState<StudentDetails>(() => toDetails(student));
  const [guardians, setGuardians] = useState<Guardian[]>(student.guardians);
  const [monthlyFee, setMonthlyFee] = useState(String(student.monthlyFee));
  const [discount, setDiscount] = useState(String(student.discountPercent));
  const [error, setError] = useState<string | null>(null);
  const [update, { isLoading }] = useUpdateStudentMutation();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateStudentDetails(details) ?? validateGuardians(guardians);
    if (problem) return setError(problem);
    const fee = Number(monthlyFee);
    const off = Number(discount);
    if (!Number.isInteger(fee) || fee < 0) return setError("Monthly tuition must be a whole number of rupees.");
    if (!Number.isFinite(off) || off < 0 || off > 100) return setError("The discount must be between 0 and 100%.");
    const result = await update({
      id: student.id,
      name: fullName(details),
      dateOfBirth: details.dateOfBirth,
      gender: details.gender,
      bForm: details.bForm || undefined,
      bloodGroup: details.bloodGroup || undefined,
      religion: details.religion,
      address: details.address.trim(),
      previousSchool: details.previousSchool.trim() || undefined,
      photoUrl: details.photoUrl,
      guardians,
      monthlyFee: fee,
      discountPercent: off,
    });
    if ("error" in result) return setError(errorMessage(result.error));
    router.push(`/students/${student.id}?saved=1`);
  };

  return (
    <form onSubmit={save} noValidate className="mx-auto max-w-4xl space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Student</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            Roll ID {student.id}, admission no. {student.admissionNo}. To change class or campus, use More actions on the profile.
          </CardDescription>
        </div>
        <StudentDetailsFields value={details} onChange={setDetails} />
      </Card>

      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Guardians</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Who the school contacts about fees, attendance and results.</CardDescription>
        </div>
        <GuardiansEditor value={guardians} onChange={setGuardians} />
      </Card>

      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Fee</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Changes apply from the next voucher.</CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField id="edit-fee" label="Monthly tuition (Rs)" inputMode="numeric" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value.replace(/\D/g, ""))} />
          <TextField id="edit-discount" label="Discount (%)" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d.]/g, ""))} />
          <div className="flex flex-col justify-end rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Payable each month</span>
            <span className="text-base font-semibold tabular-nums">
              {formatRupees(Math.round((Number(monthlyFee) || 0) * (1 - (Number(discount) || 0) / 100)))}
            </span>
          </div>
        </div>
      </Card>

      {error ? <FormStatus error={error} /> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href={`/students/${student.id}`} variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={isLoading || readOnly}>
          <Save data-icon="inline-start" />
          {isLoading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
