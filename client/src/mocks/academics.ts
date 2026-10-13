/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { ClassSubject, SchoolClass, Section, Subject } from "@/types";

/** Grades and section letters per branch. Lahore Central matches the dashboard register. */
const layout: Record<string, [grade: number, letters: string][]> = {
  "br-1": [[1, "ABC"], [2, "ABC"], [3, "ABC"], [4, "ABC"], [5, "ABC"], [6, "ABCD"], [7, "ABCD"], [8, "ABC"], [9, "ABC"], [10, "ABC"]],
  "br-2": [[6, "AB"], [7, "AB"], [8, "AB"], [9, "AB"], [10, "AB"]],
  "br-3": [[1, "AB"], [2, "AB"], [3, "AB"], [4, "AB"], [5, "AB"]],
  "br-4": [[9, "AB"], [10, "AB"]],
};

/** Class incharges at Lahore Central, by section. */
const incharges: Record<string, string> = {
  "br-1-10-A": "STF-201",
  "br-1-10-B": "STF-202",
  "br-1-9-A": "STF-203",
  "br-1-9-B": "STF-204",
  "br-1-8-A": "STF-205",
};

export const classes: SchoolClass[] = Object.entries(layout).flatMap(([branchId, grades]) =>
  grades.map(([grade]) => ({
    id: `${branchId}-${grade}`,
    branchId,
    name: `Class ${grade}`,
    order: grade,
    ...(grade >= 9 ? { stage: "Matric" } : {}),
  }))
);

export const sections: Section[] = Object.entries(layout).flatMap(([branchId, grades]) =>
  grades.flatMap(([grade, letters]) =>
    [...letters].map((letter) => {
      const id = `${branchId}-${grade}-${letter}`;
      return {
        id,
        classId: `${branchId}-${grade}`,
        name: letter,
        shift: letter === "C" || letter === "D" ? ("evening" as const) : ("morning" as const),
        capacity: grade <= 5 ? 35 : 40,
        ...(incharges[id] ? { inchargeId: incharges[id] } : {}),
      };
    })
  )
);

export const subjects: Subject[] = [
  { id: "sub-phy", name: "Physics", code: "PHY" },
  { id: "sub-math", name: "Mathematics", code: "MATH" },
  { id: "sub-chem", name: "Chemistry", code: "CHEM" },
  { id: "sub-bio", name: "Biology", code: "BIO" },
  { id: "sub-eng", name: "English Literature", code: "ENG" },
  { id: "sub-cs", name: "Computer Science", code: "CS" },
  { id: "sub-urdu", name: "Urdu", code: "URDU" },
  { id: "sub-pst", name: "Pakistan Studies", code: "PST" },
  { id: "sub-gsci", name: "General Science", code: "GSCI" },
  { id: "sub-isl", name: "Islamiyat", code: "ISL" },
];

const primary = ["sub-eng", "sub-urdu", "sub-math", "sub-gsci", "sub-isl"];
const middle = ["sub-eng", "sub-urdu", "sub-math", "sub-gsci", "sub-isl", "sub-cs"];
const matricCore = ["sub-eng", "sub-urdu", "sub-math", "sub-phy", "sub-chem", "sub-isl", "sub-pst"];
const matricElective = ["sub-bio", "sub-cs"];

export const classSubjects: ClassSubject[] = classes.flatMap((c) => {
  const core = c.order <= 5 ? primary : c.order <= 8 ? middle : matricCore;
  const electives = c.order >= 9 ? matricElective : [];
  return [
    ...core.map((subjectId) => ({ id: `${c.id}-${subjectId}`, classId: c.id, subjectId, elective: false })),
    ...electives.map((subjectId) => ({ id: `${c.id}-${subjectId}`, classId: c.id, subjectId, elective: true })),
  ];
});
