"use client";

import { useBranchClasses, useClassSections } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { useTableState } from "@/components/shared/DataTableParts";
import { toCsv } from "@/lib/csv";
import { useGetStudentsQuery } from "@/store/api";
import type { Student } from "@/types";
import { usePlacement } from "./hooks";
import { primaryGuardian, studentStatus, studentStatusLabels } from "./status";

export const statusFilterOptions = [
  { value: "current", label: "Current students" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Fee pending" },
  { value: "defaulter", label: "Defaulter" },
  { value: "withdrawn", label: "Left school" },
  { value: "all", label: "Everyone" },
];

export const genderFilterOptions = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Boys" },
  { value: "female", label: "Girls" },
];

/**
 * Filters, search, sort and paging for the student directory at the selected
 * campus. Everything lives in the URL, so a filtered list can be shared.
 */
export function useStudentDirectory() {
  const branch = useCurrentBranch();
  const { data: students = [] } = useGetStudentsQuery();
  const placement = usePlacement();
  const classes = useBranchClasses();

  const [query, setQuery] = useUrlParam("q", "");
  const [classFilter, setClassFilter] = useUrlParam("class", "all");
  const [sectionFilter, setSectionFilter] = useUrlParam("section", "all");
  const [genderFilter, setGenderFilter] = useUrlParam("gender", "all");
  const [statusFilter, setStatusFilter] = useUrlParam("status", "current");
  const table = useTableState("id");
  const sections = useClassSections(classFilter === "all" ? undefined : classFilter);

  const atCampus = students.filter((s) => s.branchId === branch?.id);
  const needle = query.trim().toLowerCase();
  const digitsOnly = needle.replace(/\D/g, "");

  const filtered = atCampus.filter((s) => {
    const status = studentStatus(s);
    if (statusFilter === "current" ? status === "withdrawn" : statusFilter !== "all" && status !== statusFilter) return false;
    if (classFilter !== "all" && s.classId !== classFilter) return false;
    if (sectionFilter !== "all" && s.sectionId !== sectionFilter) return false;
    if (genderFilter !== "all" && s.gender !== genderFilter) return false;
    if (!needle) return true;
    const guardian = primaryGuardian(s);
    return (
      s.name.toLowerCase().includes(needle) ||
      s.id.toLowerCase().includes(needle) ||
      s.admissionNo.toLowerCase().includes(needle) ||
      s.guardians.some((g) => g.name.toLowerCase().includes(needle)) ||
      (digitsOnly.length >= 4 && s.guardians.some((g) => g.phone.replace(/\D/g, "").includes(digitsOnly))) ||
      (digitsOnly.length >= 5 && (s.bForm ?? "").replace(/\D/g, "").includes(digitsOnly)) ||
      Boolean(guardian && guardian.name.toLowerCase().includes(needle))
    );
  });

  const sortValue = (s: Student, key: string): string | number => {
    switch (key) {
      case "name":
        return s.name;
      case "class": {
        const cls = classes.find((c) => c.id === s.classId);
        return (cls?.order ?? 99) * 100 + placement(s).sectionName.charCodeAt(0);
      }
      case "attendance":
        return s.attendance;
      case "status":
        return studentStatusLabels[studentStatus(s)];
      default:
        return s.id;
    }
  };

  const view = table.apply(filtered, sortValue);
  const isFiltered = needle !== "" || classFilter !== "all" || sectionFilter !== "all" || genderFilter !== "all" || statusFilter !== "current";

  // Any filter change goes back to page 1.
  const withReset = (set: (v: string) => void) => (value: string) => {
    set(value);
    table.resetPage();
  };

  return {
    atCampus,
    view,
    table,
    isFiltered,
    classes,
    sections,
    filters: {
      query,
      setQuery: withReset(setQuery),
      classFilter,
      setClassFilter: (v: string) => {
        setClassFilter(v);
        setSectionFilter("all");
        table.resetPage();
      },
      sectionFilter,
      setSectionFilter: withReset(setSectionFilter),
      genderFilter,
      setGenderFilter: withReset(setGenderFilter),
      statusFilter,
      setStatusFilter: withReset(setStatusFilter),
      clear: () => {
        setQuery("");
        setClassFilter("all");
        setSectionFilter("all");
        setGenderFilter("all");
        setStatusFilter("current");
        table.resetPage();
      },
    },
    placement,
  };
}

/** The directory's rows (all pages) as a CSV file. */
export function studentsCsv(rows: Student[], placement: ReturnType<typeof usePlacement>) {
  return toCsv([
    ["Roll ID", "Admission no.", "Name", "Gender", "Date of birth", "Class", "Section", "Main guardian", "Relation", "Mobile", "Status", "Attendance %", "Balance (Rs)"],
    ...rows.map((s) => {
      const g = primaryGuardian(s);
      const p = placement(s);
      return [s.id, s.admissionNo, s.name, s.gender, s.dateOfBirth, p.className, p.sectionName, g?.name, g?.relation, g?.phone, studentStatusLabels[studentStatus(s)], s.attendance, s.balance];
    }),
  ]);
}
