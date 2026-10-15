export type Gender = "male" | "female" | "other";
export type GuardianRelation = "father" | "mother" | "guardian" | "grandparent" | "sibling";

export interface Guardian {
  id: string;
  name: string;
  relation: GuardianRelation;
  /** 12345-1234567-1 */
  cnic?: string;
  /** 0300-1234567 */
  phone: string;
  /** Alerts go to WhatsApp on this number. */
  whatsapp: boolean;
  /** The guardian fees and alerts go to first. Exactly one per student. */
  primary: boolean;
  occupation?: string;
}

export interface StudentDocument {
  id: string;
  name: string;
  kind: "b_form" | "photo" | "leaving_certificate" | "result_card" | "other";
  /** File name as uploaded. */
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface Withdrawal {
  date: string;
  reason: "transferred" | "relocated" | "fees" | "completed" | "disciplinary" | "other";
  note?: string;
}

/** How the directory and profile show a student: enrolment first, then fees. */
export type StudentStatus = "active" | "defaulter" | "pending" | "withdrawn";

export interface Student {
  /** Roll ID, e.g. STD-1042. */
  id: string;
  /** e.g. ADM-2026-0142 */
  admissionNo: string;
  admissionDate: string;
  name: string;
  email: string;
  avatar: string;
  photoUrl?: string;
  /** NADRA B-form number, 12345-1234567-1. */
  bForm?: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  religion?: string;
  address: string;
  previousSchool?: string;
  branchId: string;
  classId: string;
  sectionId: string;
  electiveSubjectIds: string[];
  guardians: Guardian[];
  siblingIds: string[];
  /** Monthly tuition before discounts, in rupees. */
  monthlyFee: number;
  discountPercent: number;
  enrollment: "active" | "withdrawn";
  withdrawal?: Withdrawal;
  feeStatus: "clear" | "pending" | "defaulter";
  /** Attendance this term, as a percentage (0-100). */
  attendance: number;
  /** Outstanding fee balance in rupees. */
  balance: number;
  documents: StudentDocument[];
}

export interface StudentActivity {
  id: string;
  studentId: string;
  /** ISO date-time. */
  at: string;
  actor: string;
  text: string;
}

/** Fields entered on admission; ids, numbers and records are filled in by the API. */
export type AdmissionInput = Omit<
  Student,
  "id" | "admissionNo" | "avatar" | "enrollment" | "withdrawal" | "feeStatus" | "attendance" | "balance" | "documents" | "siblingIds"
> & { siblingIds?: string[] };
