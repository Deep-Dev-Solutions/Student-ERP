/*
 * Pure business rules ported from the mock queryFns in client/src/store/api.ts
 * (checkPlacement, seatProblem, placement, createStudent's numbering). Kept free of
 * Prisma/Nest so they can be unit tested the same way as the mock's own logic.
 */
export interface ClassLike {
  id: string;
  branchId: string;
  name: string;
}
export interface SectionLike {
  id: string;
  classId: string;
  name: string;
}

/** Checks a class and section exist and belong together, optionally at a given campus. */
export function checkPlacement(cls: ClassLike | null | undefined, section: SectionLike | null | undefined, classId: string, branchId?: string): string | null {
  if (!cls || !section || section.classId !== classId) return "Choose a class and one of its sections";
  if (branchId && cls.branchId !== branchId) return "That class is at a different campus";
  return null;
}

/** How a placement reads in an activity log entry. */
export function placementText(cls: ClassLike | null | undefined, section: SectionLike | null | undefined): string {
  return `${cls?.name ?? "a class"}, section ${section?.name ?? "?"}`;
}

/** Admissions need a free seat on the school's plan (the Students module itself is checked by the route guard). */
export function seatProblem(studentSeats: number, activeCount: number, adding: number): string | null {
  if (activeCount + adding > studentSeats)
    return `Your plan allows ${studentSeats.toLocaleString("en-PK")} students and ${activeCount.toLocaleString("en-PK")} are enrolled. Ask DeepDev to add seats.`;
  return null;
}

/** ADM-2026-0142: the admission year, then a per-year sequence. */
export const admissionNumber = (year: string, seq: number) => `ADM-${year}-${String(seq).padStart(4, "0")}`;

/** STD-1042: a running roll id. */
export const rollId = (n: number) => `STD-${n}`;

/** Guardians must have exactly one primary contact. */
export function guardianProblem(guardians: { primary: boolean }[]): string | null {
  if (guardians.length === 0) return "A student needs at least one guardian";
  if (guardians.filter((g) => g.primary).length !== 1) return "Choose one main guardian";
  return null;
}
