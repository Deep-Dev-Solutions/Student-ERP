"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Save, UserRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToday } from "@/features/attendance/hooks";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { monthLabel } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { maskMobile, MOBILE_PATTERN } from "@/lib/masks";
import { MAX_WEEKLY_PERIODS } from "@/lib/payroll";
import { errorMessage, useGetStaffAttendanceQuery, useSaveStaffMutation } from "@/store/api";
import type { StaffMember } from "@/types";
import { usePortalTeacher, useTeachingSections } from "../hooks";

function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || "—"}</dd>
    </div>
  );
}

/** The signed-in teacher's own record, with the contact details they can keep up to date. */
export function TeacherProfile() {
  const { user, member, viewingAs } = usePortalTeacher();
  if (!member || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Card className="py-0">
          <EmptyState icon={UserRound} title="Your staff record isn't linked yet" description="Ask the branch admin to link your login to your staff record." />
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title={member.name} description={`${member.staffId}, ${member.role}, ${member.department}.`} />
      {viewingAs ? <p className="text-sm text-muted-foreground">You&apos;re viewing the portal as the demo teacher.</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContactCard key={member.id} member={member} />
        <Card className="gap-4 px-5 sm:px-6">
          <div>
            <CardTitle>
              <h2>Employment</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Ask the office to change these.</CardDescription>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Staff number">{member.staffId}</Detail>
            <Detail label="Department">{member.department}</Detail>
            <Detail label="Joined">{formatDate(member.joinDate)}</Detail>
            <Detail label="Employment">{member.employment === "permanent" ? "Permanent" : member.employment === "contract" ? "Contract" : "Visiting"}</Detail>
            <Detail label="Qualification">{member.qualification}</Detail>
            <Detail label="Email">{member.email}</Detail>
          </dl>
        </Card>
        <TeachingCard />
        <AttendanceCard member={member} />
      </div>
      <Card className="gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-sm">
          <KeyRound aria-hidden className="size-4 text-muted-foreground" />
          Signed in as {user.email}, {ROLE_LABELS[user.role]}.
        </p>
        <ButtonLink href="/reset-password" variant="outline">
          Change password
        </ButtonLink>
      </Card>
    </div>
  );
}

function ContactCard({ member }: { member: StaffMember }) {
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address ?? "");
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const [save, { isLoading }] = useSaveStaffMutation();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!MOBILE_PATTERN.test(phone)) return setNotice({ error: "The mobile number should look like 0300-1234567." });
    const result = await save({ ...member, phone, address: address.trim() });
    setNotice("error" in result ? { error: errorMessage(result.error) } : { success: "Contact details saved." });
  };
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>Contact details</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">The school uses these to reach you.</CardDescription>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField id="profile-phone" label="Mobile" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(maskMobile(e.target.value))} />
        <TextField id="profile-address" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus success={notice.success} error={notice.error} />
          <Button type="submit" disabled={isLoading || (phone === member.phone && address === (member.address ?? ""))}>
            <Save data-icon="inline-start" />
            Save details
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TeachingCard() {
  const sections = useTeachingSections();
  const periods = sections.reduce((n, t) => n + t.subjects.reduce((m, s) => m + s.weeklyPeriods, 0), 0);
  const incharge = sections.filter((t) => t.incharge);
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <CardTitle>
          <h2>Teaching</h2>
        </CardTitle>
        <Link href="/teacher-portal/classes" className="rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
          My classes
        </Link>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Detail label="Periods a week">
          {periods} of {MAX_WEEKLY_PERIODS}
        </Detail>
        <Detail label="Sections">{sections.length}</Detail>
        <Detail label="Class incharge" className="sm:col-span-2">
          {incharge.length ? incharge.map((t) => t.label).join("; ") : "None"}
        </Detail>
      </dl>
    </Card>
  );
}

function AttendanceCard({ member }: { member: StaffMember }) {
  const today = useToday();
  const { data: days = [] } = useGetStaffAttendanceQuery();
  const month = (today ?? "2026-10-01").slice(0, 7);
  const mine = days.filter((d) => d.branchId === member.branchId && d.date.startsWith(month) && d.marks[member.staffId]);
  const count = (s: string) => mine.filter((d) => d.marks[member.staffId] === s).length;
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>My attendance</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">{monthLabel(month)}, as marked by the office.</CardDescription>
      </div>
      <dl className="grid grid-cols-4 gap-3">
        {[
          ["Present", count("present")],
          ["Late", count("late")],
          ["Absent", count("absent")],
          ["Leave", count("leave")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
