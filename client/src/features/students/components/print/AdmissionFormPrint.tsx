"use client";

import { UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatRupees } from "@/lib/format";
import { useGetSectionsQuery, useGetStudentsQuery, useGetSubjectsQuery, useGetTeachersQuery } from "@/store/api";
import { usePlacement } from "../../hooks";
import { relationLabels } from "../../status";
import { PrintToolbar } from "./PrintToolbar";
import { SchoolLetterhead } from "./SchoolLetterhead";

const genderLabels = { male: "Male", female: "Female", other: "Other" } as const;

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
      <dd className="min-h-5 border-b border-border pb-0.5 font-medium">{value || " "}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** The admission form for one student, laid out for A4 paper. */
export function AdmissionFormPrint({ studentId }: { studentId: string }) {
  const { data: students = [] } = useGetStudentsQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const placement = usePlacement();
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <EmptyState
        icon={UserRound}
        title="We couldn't find this student"
        description="The roll ID may be wrong, or the record was deleted."
        action={<ButtonLink href="/students">Back to students</ButtonLink>}
      />
    );
  }

  const where = placement(student);
  const incharge = teachers.find((t) => t.id === sections.find((s) => s.id === student.sectionId)?.inchargeId);
  const electives = subjects.filter((s) => student.electiveSubjectIds.includes(s.id)).map((s) => s.name);
  const fee = Math.round(student.monthlyFee * (1 - student.discountPercent / 100));
  const has = (kind: string) => student.documents.some((d) => d.kind === kind);
  const checklist = [
    ["B-form copy", has("b_form") || Boolean(student.bForm)],
    ["Two passport-size photos", has("photo") || Boolean(student.photoUrl)],
    ["Previous result card", has("result_card")],
    ["Leaving certificate", has("leaving_certificate")],
  ] as const;

  return (
    <>
      <PrintToolbar backHref={`/students/${student.id}`} backLabel="Back to profile" />
      <article className="mx-auto max-w-[210mm] space-y-6 p-6 text-sm sm:p-10 print:max-w-none print:p-0">
        <SchoolLetterhead
          title="Admission form"
          meta={
            <>
              Admission no. {student.admissionNo}
              <br />
              Roll ID {student.id}, admitted {formatDate(student.admissionDate)}
            </>
          }
        />

        <div className="flex gap-6">
          <Section title="Student">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Full name" value={student.name} wide />
              <Field label="Date of birth" value={formatDate(student.dateOfBirth)} />
              <Field label="Gender" value={genderLabels[student.gender]} />
              <Field label="B-form number" value={student.bForm} />
              <Field label="Blood group" value={student.bloodGroup} />
              <Field label="Religion" value={student.religion} />
              <Field label="Previous school" value={student.previousSchool} />
              <Field label="Home address" value={student.address} wide />
            </dl>
          </Section>
          <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-foreground/40 text-xs text-muted-foreground">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a printed photo, not an optimisable asset
              <img src={student.photoUrl} alt={`Photo of ${student.name}`} className="size-full object-cover" />
            ) : (
              "Paste photo"
            )}
          </div>
        </div>

        <Section title="Guardians">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-foreground/40 text-[0.7rem] text-muted-foreground">
                <th className="py-1 pr-3 font-normal">Name</th>
                <th className="py-1 pr-3 font-normal">Relation</th>
                <th className="py-1 pr-3 font-normal">Mobile</th>
                <th className="py-1 pr-3 font-normal">CNIC</th>
                <th className="py-1 font-normal">Contact for</th>
              </tr>
            </thead>
            <tbody>
              {student.guardians.map((g) => (
                <tr key={g.id} className="border-b border-border">
                  <td className="py-1.5 pr-3 font-medium">{g.name}</td>
                  <td className="py-1.5 pr-3">{relationLabels[g.relation]}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{g.phone}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{g.cnic ?? "—"}</td>
                  <td className="py-1.5">{[g.primary ? "Fees and alerts" : null, g.whatsapp ? "WhatsApp" : null].filter(Boolean).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Class and fee">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Field label="Campus" value={where.branchName} />
            <Field label="Class and section" value={`${where.className}, section ${where.sectionName}`} />
            <Field label="Class incharge" value={incharge?.name} />
            <Field label="Electives" value={electives.join(", ") || "None"} />
            <Field label="Monthly tuition" value={formatRupees(student.monthlyFee)} />
            <Field label="Payable after discount" value={`${formatRupees(fee)}${student.discountPercent ? ` (${student.discountPercent}% off)` : ""}`} />
          </dl>
        </Section>

        <Section title="Documents received">
          <ul className="grid grid-cols-2 gap-2">
            {checklist.map(([label, received]) => (
              <li key={label} className="flex items-center gap-2">
                <span aria-hidden className="flex size-4 items-center justify-center rounded-sm border border-foreground/60 text-[0.7rem] leading-none">
                  {received ? "✓" : ""}
                </span>
                {label}
                <span className="sr-only">{received ? ", received" : ", not received"}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Declaration">
          <p className="text-muted-foreground">
            I confirm the details above are correct and agree to follow the school&apos;s rules, including paying fees by the due date each month.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-10">
            {["Signature of guardian", "Principal's signature and stamp"].map((label) => (
              <div key={label} className="border-t border-foreground pt-1 text-xs text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
        </Section>
      </article>
    </>
  );
}
