"use client";

import { useMemo } from "react";
import { useBranchClasses } from "@/hooks/use-academics";
import { useCurrentUser } from "@/hooks/use-session";
import { DEMO_TEACHER_ID } from "@/mocks/users";
import { useGetAllocationsQuery, useGetSectionsQuery, useGetStaffQuery, useGetSubjectsQuery, useGetUsersQuery } from "@/store/api";
import type { SchoolClass, Section } from "@/types";

/**
 * The teacher the portal is showing: the signed-in teacher, or the demo
 * teacher when an admin opens the portal (until real accounts exist).
 */
export function usePortalTeacher() {
  const currentUser = useCurrentUser();
  const { data: users = [] } = useGetUsersQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const user = currentUser?.role === "teacher" ? currentUser : users.find((u) => u.id === DEMO_TEACHER_ID);
  const member = staff.find((m) => m.staffId === user?.staffId);
  return { user, member, staffId: user?.staffId, viewingAs: Boolean(currentUser && currentUser.role !== "teacher") };
}

export interface TeachingSection {
  section: Section;
  cls: SchoolClass;
  /** "Class 10, section A" */
  label: string;
  incharge: boolean;
  subjects: { id: string; name: string; weeklyPeriods: number }[];
}

/** Sections at this campus the portal teacher teaches or is incharge of, in class order. */
export function useTeachingSections(): TeachingSection[] {
  const { staffId } = usePortalTeacher();
  const classes = useBranchClasses();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: allocations = [] } = useGetAllocationsQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  return useMemo(() => {
    if (!staffId) return [];
    return classes.flatMap((cls) =>
      sections
        .filter((s) => s.classId === cls.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((section) => {
          const mine = allocations.filter((a) => a.sectionId === section.id && a.teacherId === staffId);
          return {
            section,
            cls,
            label: `${cls.name}, section ${section.name}`,
            incharge: section.inchargeId === staffId,
            subjects: mine.map((a) => ({ id: a.subjectId, name: subjects.find((s) => s.id === a.subjectId)?.name ?? "", weeklyPeriods: a.weeklyPeriods })),
          };
        })
        .filter((t) => t.incharge || t.subjects.length > 0)
    );
  }, [staffId, classes, sections, allocations, subjects]);
}
