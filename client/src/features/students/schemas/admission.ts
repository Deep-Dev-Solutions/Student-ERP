import { z } from "zod";

const PK_MOBILE = /^03\d{2}-?\d{7}$/;
const CNIC = /^\d{5}-?\d{7}-?\d$/;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const admissionSchema = z.object({
  // Step 1: Student information
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  dateOfBirth: z.iso
    .date("Enter a valid date of birth")
    .refine((value) => new Date(value) < new Date(), "Date of birth must be in the past"),
  gender: z.enum(["male", "female", "other"], "Select a gender"),
  bloodGroup: z.enum(["a_pos", "b_pos", "o_pos", "ab_pos", "other"]).optional(),
  previousSchool: optionalText,

  // Step 2: Guardian & emergency contacts
  guardianName: z.string().trim().min(3, "Guardian name is required"),
  guardianCnic: z
    .string()
    .trim()
    .regex(CNIC, "CNIC format: 35201-1234567-1")
    .optional()
    .or(z.literal("")),
  whatsappNumber: z.string().trim().regex(PK_MOBILE, "Mobile format: 0300-1234567"),
  emergencyPhone: z
    .string()
    .trim()
    .regex(PK_MOBILE, "Mobile format: 0321-1234567")
    .optional()
    .or(z.literal("")),

  // Step 3: Academic assignment & fee structure
  enrollingClass: z.enum(["9", "10"], "Select a class"),
  section: z.enum(["a", "b", "c"], "Select a section"),
  monthlyFee: z.coerce
    .number<string>("Enter the monthly fee")
    .int("Fee must be a whole number")
    .min(0, "Fee cannot be negative")
    .max(1_000_000, "Fee looks too high"),
});

export type AdmissionFormInput = z.input<typeof admissionSchema>;
export type AdmissionFormValues = z.output<typeof admissionSchema>;

export const admissionDefaults: AdmissionFormInput = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "male",
  bloodGroup: "b_pos",
  previousSchool: "",
  guardianName: "",
  guardianCnic: "",
  whatsappNumber: "",
  emergencyPhone: "",
  enrollingClass: "9",
  section: "a",
  monthlyFee: "3000",
};
