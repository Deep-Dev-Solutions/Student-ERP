"use client";

import { useCallback } from "react";
import { useGetBranchesQuery, useGetClassesQuery, useGetSectionsQuery, useGetStudentsQuery } from "@/store/api";
import type { Student } from "@/types";

export interface Placement {
  className: string;
  sectionName: string;
  /** "Section A" */
  sectionLabel: string;
  branchName: string;
}

/** Looks up the class, section and campus names for a student. */
export function usePlacement() {
  const { data: classes = [] } = useGetClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  return useCallback(
    (student: Pick<Student, "classId" | "sectionId" | "branchId">): Placement => {
      const section = sections.find((s) => s.id === student.sectionId);
      return {
        className: classes.find((c) => c.id === student.classId)?.name ?? "No class",
        sectionName: section?.name ?? "",
        sectionLabel: section ? `Section ${section.name}` : "No section",
        branchName: branches.find((b) => b.id === student.branchId)?.name ?? "",
      };
    },
    [classes, sections, branches]
  );
}

/** One student by roll ID, or undefined when there's no such student. */
export function useStudent(id: string): Student | undefined {
  const { data: students = [] } = useGetStudentsQuery();
  return students.find((s) => s.id === id);
}
