/*
 * Registers for the first two weeks of October 2026 at Lahore Central, so
 * Review, alerts and the monthly sheet have history. Generated the same way
 * every time from each student's attendance rate. Dates are fixed (not
 * relative to today) so the server and browser build identical data.
 */
import type { AttendanceRegister, StaffAttendanceDay, UnlockRequest } from "@/types";
import { students } from "./students";
import { staff } from "./staff";

const schoolDays = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, "0")}`).filter(
  (d) => new Date(`${d}T12:00:00Z`).getUTCDay() !== 0
);

/** A stable number from 0 to 99 for a student on a day. */
const roll = (key: string) => {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h) % 100;
};

const active = students.filter((s) => s.enrollment === "active" && s.branchId === "br-1");
const sectionIds = [...new Set(active.map((s) => s.sectionId))];

export const registers: AttendanceRegister[] = schoolDays.flatMap((date) =>
  sectionIds.map((sectionId) => {
    const roster = active.filter((s) => s.sectionId === sectionId);
    const marks = Object.fromEntries(
      roster.map((s) => {
        const r = roll(`${s.id}:${date}`);
        const status = r < s.attendance ? "present" : r % 4 === 0 ? "leave" : "absent";
        return [s.id, status === "leave" ? { status, remark: "Leave application received" } : { status }];
      })
    ) as AttendanceRegister["marks"];
    return {
      id: `${sectionId}:${date}`,
      branchId: "br-1",
      classId: roster[0].classId,
      sectionId,
      date,
      marks,
      submittedAt: `${date}T08:40:00`,
      submittedBy: "Class incharge",
      lockedAt: `${date}T15:00:00`,
      lockedBy: "End of day",
      alertsSentAt: `${date}T09:00:00`,
      changes: [],
    };
  })
);

export const unlockRequests: UnlockRequest[] = [
  {
    id: "unlock-1",
    registerId: `br-1-9-C:${schoolDays.at(-1)}`,
    reason: "Zainab Tariq was marked absent but arrived late with a note from her father.",
    requestedBy: "Rashid Minhas (Teacher)",
    requestedAt: `${schoolDays.at(-1)}T16:10:00`,
    status: "pending",
  },
];

export const staffAttendance: StaffAttendanceDay[] = schoolDays.map((date) => ({
  id: `br-1:${date}`,
  branchId: "br-1",
  date,
  marks: Object.fromEntries(
    staff.map((m) => {
      const r = roll(`${m.staffId}:${date}`);
      return [m.staffId, m.status === "on_leave" ? "leave" : r < 88 ? "present" : r < 95 ? "late" : "absent"];
    })
  ),
  savedAt: `${date}T09:30:00`,
  savedBy: "Sana Javed (Front desk)",
}));
