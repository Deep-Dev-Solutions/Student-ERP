"use client";

import { classLabel, sectionLabel, useBranchClasses, useClassSections, useClassSubjects } from "@/hooks/use-academics";
import { useUrlParam } from "@/hooks/use-url-state";
import { useToday } from "./hooks";

/**
 * Which register is open: class, section, date and (in subject-wise mode)
 * subject. Kept in the URL, so Review can link straight to a register and the
 * tabs share the same date.
 */
export function useRegisterSelection(defaults = { className: "Class 9", section: "A" }) {
  const today = useToday();
  const classes = useBranchClasses();
  const [classParam, setClassParam] = useUrlParam("class", "");
  const [sectionParam, setSectionParam] = useUrlParam("section", "");
  const [dateParam, setDate] = useUrlParam("date", "");
  const [subjectParam, setSubject] = useUrlParam("subject", "");

  const selectedClass = classes.find((c) => c.id === classParam) ?? classes.find((c) => c.name === defaults.className) ?? classes[0];
  const sections = useClassSections(selectedClass?.id);
  const selectedSection = sections.find((s) => s.id === sectionParam) ?? sections.find((s) => s.name === defaults.section) ?? sections[0];
  const subjects = useClassSubjects(selectedClass?.id);
  const selectedSubject = subjects.find((s) => s.id === subjectParam) ?? subjects[0];
  const date = dateParam || today || "";

  return {
    today,
    date,
    setDate: (value: string) => setDate(value === today ? "" : value),
    classId: selectedClass?.id ?? "",
    sectionId: selectedSection?.id ?? "",
    subjectId: selectedSubject?.id ?? "",
    selectedClass,
    selectedSection,
    selectedSubject,
    setClassId: (id: string) => {
      setClassParam(id);
      setSectionParam("");
      setSubject("");
    },
    setSectionId: setSectionParam,
    setSubjectId: setSubject,
    classOptions: classes.map((c) => ({ value: c.id, label: classLabel(c) })),
    sectionOptions: sections.map((s) => ({ value: s.id, label: sectionLabel(s) })),
    subjectOptions: subjects.map((s) => ({ value: s.id, label: s.elective ? `${s.name} (elective)` : s.name })),
  };
}
