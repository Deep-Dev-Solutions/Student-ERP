import { z } from "zod";

/** client/src/types/settings.ts → SchoolRules */
export const rulesSchema = z.object({
  attendance: z.object({
    mode: z.enum(["class_incharge", "subject_wise", "single_marker", "admin_oversight"]),
    lockAfterHours: z.number().int().min(0).max(720),
    holidays: z.array(z.object({ id: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), name: z.string().min(1) })),
  }),
  fees: z.object({
    dueDay: z.number().int().min(1).max(28),
    lateFinePerDay: z.number().int().min(0),
    graceDays: z.number().int().min(0).max(60),
    siblingDiscountPercent: z.number().min(0).max(100),
  }),
  grading: z.object({
    passPercent: z.number().min(0).max(100),
    bands: z.array(z.object({ label: z.string().min(1).max(3), min: z.number().min(0).max(100) })).min(1),
  }),
  notifications: z.record(z.string(), z.boolean()),
});
