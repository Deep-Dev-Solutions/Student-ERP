"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StudentEditForm } from "@/features/students/components/StudentEditForm";
import { useStudent } from "@/features/students/hooks";

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = decodeURIComponent(id);
  const student = useStudent(studentId);
  return (
    <div className="space-y-6">
      <PageHeader title={student ? `Edit ${student.name}` : "Edit student"} description="Personal details, guardians and fee." />
      <StudentEditForm studentId={studentId} />
    </div>
  );
}
