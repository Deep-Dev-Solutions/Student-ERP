"use client";

import { useCallback, useMemo, useState } from "react";
import { useCurrentBranch } from "@/hooks/use-session";
import { gradeFor } from "@/lib/grades";
import {
  useGetClassesQuery,
  useGetClassSubjectsQuery,
  useGetSchoolRulesQuery,
  useGetSectionsQuery,
  useGetSessionsQuery,
  useGetSubjectsQuery,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import type { AcademicSession, SchoolClass, Section, Subject } from "@/types";

export interface Option {
  value: string;
  label: string;
}

/** "Class 9 (Matric)" when the class has a stage, otherwise "Class 9". */
export const classLabel = (c: SchoolClass, withStage = false) => (withStage && c.stage ? `${c.name} (${c.stage})` : c.name);
/** "Section A", or "Section A (morning)" with the shift. */
export const sectionLabel = (s: Section, withShift = false) => (withShift ? `Section ${s.name} (${s.shift})` : `Section ${s.name}`);

/** Classes at the selected campus, in order. */
export function useBranchClasses(): SchoolClass[] {
  const branch = useCurrentBranch();
  const { data: classes = [] } = useGetClassesQuery();
  return useMemo(
    () => classes.filter((c) => c.branchId === branch?.id).sort((a, b) => a.order - b.order),
    [classes, branch?.id]
  );
}

/** Sections of one class, in letter order. */
export function useClassSections(classId: string | undefined): Section[] {
  const { data: sections = [] } = useGetSectionsQuery();
  return useMemo(
    () => sections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name)),
    [sections, classId]
  );
}

/** Subjects taught in one class: core first, then electives, each in catalogue order. */
export function useClassSubjects(classId: string | undefined): (Subject & { elective: boolean })[] {
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  return useMemo(() => {
    const offered = new Map(classSubjects.filter((cs) => cs.classId === classId).map((cs) => [cs.subjectId, cs.elective]));
    return subjects
      .filter((s) => offered.has(s.id))
      .map((s) => ({ ...s, elective: offered.get(s.id)! }))
      .sort((a, b) => Number(a.elective) - Number(b.elective));
  }, [subjects, classSubjects, classId]);
}

/** The session marked current in Academics (where new records go). */
export function useCurrentSession(): AcademicSession | undefined {
  const { data: sessions = [] } = useGetSessionsQuery();
  return sessions.find((s) => s.current) ?? sessions[0];
}

/** The session picked in the header; past sessions are read-only. */
export function useSelectedSession(): { session: AcademicSession | undefined; readOnly: boolean } {
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const { data: sessions = [] } = useGetSessionsQuery();
  const current = sessions.find((s) => s.current);
  const session = sessions.find((s) => s.id === sessionId) ?? current;
  return { session, readOnly: Boolean(session && current && session.id !== current.id) };
}

/** True while viewing a past session: changes are turned off. */
export function useReadOnly() {
  return useSelectedSession().readOnly;
}

/** Grades a percentage with the bands and pass mark from Settings → School rules. */
export function useGrader() {
  const grading = useGetSchoolRulesQuery().data?.grading;
  return useCallback(
    (percentage: number | null) => gradeFor(percentage, grading?.bands, grading?.passPercent),
    [grading]
  );
}

/**
 * Class and section pickers for the selected campus. Starts on the named
 * class and section when they exist, and falls back to the first ones when
 * the campus changes.
 */
export function useClassSectionPicker(defaults: { className?: string; section?: string } = {}, opts: { withStage?: boolean; withShift?: boolean } = {}) {
  const classes = useBranchClasses();
  const [pickedClassId, setPickedClassId] = useState<string | undefined>(
    () => classes.find((c) => c.name === defaults.className)?.id
  );
  const selectedClass = classes.find((c) => c.id === pickedClassId) ?? classes.find((c) => c.name === defaults.className) ?? classes[0];
  const sections = useClassSections(selectedClass?.id);
  const [pickedSectionId, setPickedSectionId] = useState<string | undefined>();
  const selectedSection =
    sections.find((s) => s.id === pickedSectionId) ?? sections.find((s) => s.name === defaults.section) ?? sections[0];

  return {
    classes,
    sections,
    selectedClass,
    selectedSection,
    classId: selectedClass?.id ?? "",
    sectionId: selectedSection?.id ?? "",
    setClassId: (id: string) => {
      setPickedClassId(id);
      setPickedSectionId(undefined);
    },
    setSectionId: setPickedSectionId,
    classOptions: classes.map((c) => ({ value: c.id, label: classLabel(c, opts.withStage) })),
    sectionOptions: sections.map((s) => ({ value: s.id, label: sectionLabel(s, opts.withShift) })),
  };
}
