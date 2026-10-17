/*
 * Spreadsheet import: the template, matching file columns to fields, and
 * checking each row before anything is saved.
 */
import { toCsv } from "@/lib/csv";
import { CNIC_PATTERN, maskCnic, maskMobile, MOBILE_PATTERN } from "@/lib/masks";
import type { AdmissionInput, Gender, GuardianRelation, SchoolClass, Section, Student } from "@/types";

export type ImportField =
  | "firstName" | "lastName" | "dateOfBirth" | "gender" | "bForm" | "className" | "section"
  | "guardianName" | "guardianRelation" | "guardianPhone" | "guardianCnic" | "address"
  | "admissionDate" | "monthlyFee" | "previousSchool" | "bloodGroup";

export const IMPORT_FIELDS: { key: ImportField; label: string; required: boolean; example: [string, string]; aliases: string[] }[] = [
  { key: "firstName", label: "First name", required: true, example: ["Ahmed", "Hira"], aliases: ["first name", "firstname", "name", "student name", "student"] },
  { key: "lastName", label: "Last name", required: true, example: ["Raza", "Iqbal"], aliases: ["last name", "lastname", "surname", "family name"] },
  { key: "dateOfBirth", label: "Date of birth", required: true, example: ["2014-03-14", "22/07/2012"], aliases: ["date of birth", "dob", "birth date", "birthdate"] },
  { key: "gender", label: "Gender", required: true, example: ["Male", "Female"], aliases: ["gender", "sex"] },
  { key: "bForm", label: "B-form number", required: false, example: ["35202-1234567-1", ""], aliases: ["b form", "bform", "b-form", "b form number", "b-form number", "form b", "cnic", "nadra"] },
  { key: "className", label: "Class", required: true, example: ["Class 5", "8"], aliases: ["class", "grade", "class name"] },
  { key: "section", label: "Section", required: true, example: ["A", "B"], aliases: ["section", "sec"] },
  { key: "guardianName", label: "Father or guardian name", required: true, example: ["Imran Raza", "Kashif Iqbal"], aliases: ["father name", "fathers name", "father's name", "guardian", "guardian name", "parent", "parent name", "father"] },
  { key: "guardianRelation", label: "Relation", required: false, example: ["Father", "Mother"], aliases: ["relation", "relationship"] },
  { key: "guardianPhone", label: "Guardian mobile", required: true, example: ["0300-1234567", "03211234567"], aliases: ["mobile", "phone", "contact", "guardian mobile", "father mobile", "whatsapp", "cell", "mobile number", "phone number"] },
  { key: "guardianCnic", label: "Guardian CNIC", required: false, example: ["35202-7654321-9", ""], aliases: ["guardian cnic", "father cnic", "parent cnic"] },
  { key: "address", label: "Address", required: false, example: ["House 12, Johar Town, Lahore", "Flat 3, Garden Town, Lahore"], aliases: ["address", "home address", "residence"] },
  { key: "admissionDate", label: "Admission date", required: false, example: ["2026-04-01", ""], aliases: ["admission date", "date of admission", "joining date", "admitted"] },
  { key: "monthlyFee", label: "Monthly fee", required: false, example: ["2800", ""], aliases: ["monthly fee", "fee", "tuition", "monthly tuition"] },
  { key: "previousSchool", label: "Previous school", required: false, example: ["", "City Grammar School"], aliases: ["previous school", "last school"] },
  { key: "bloodGroup", label: "Blood group", required: false, example: ["B+", ""], aliases: ["blood group", "blood"] },
];

/** The template file: headers plus two example rows. */
export const templateCsv = () =>
  toCsv([IMPORT_FIELDS.map((f) => f.label), IMPORT_FIELDS.map((f) => f.example[0]), IMPORT_FIELDS.map((f) => f.example[1])]);

const normalize = (h: string) => h.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, " ").trim();

/** Matches each field to a file column by name; unmatched fields map to -1. */
export function autoMap(headers: string[]): Record<ImportField, number> {
  const normalized = headers.map(normalize);
  const used = new Set<number>();
  const map = {} as Record<ImportField, number>;
  for (const field of IMPORT_FIELDS) {
    const names = [field.label, ...field.aliases].map(normalize);
    // Exact matches first, so "Guardian CNIC" doesn't take the B-form's "cnic" alias.
    let index = normalized.findIndex((h, i) => !used.has(i) && names.includes(h));
    if (index === -1) index = normalized.findIndex((h, i) => !used.has(i) && names.some((n) => n.length > 3 && h.includes(n)));
    if (index !== -1) used.add(index);
    map[field.key] = index;
  }
  return map;
}

/** YYYY-MM-DD from YYYY-MM-DD, DD/MM/YYYY or DD-MM-YYYY, or null. */
export function parseDate(value: string): string | null {
  const v = value.trim();
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const parseGender = (v: string): Gender | null => {
  const g = v.trim().toLowerCase();
  if (["m", "male", "boy"].includes(g)) return "male";
  if (["f", "female", "girl"].includes(g)) return "female";
  if (["other", "o"].includes(g)) return "other";
  return null;
};

const parseRelation = (v: string): GuardianRelation => {
  const r = v.trim().toLowerCase();
  if (r.startsWith("mo")) return "mother";
  if (r.startsWith("grand")) return "grandparent";
  if (r.startsWith("bro") || r.startsWith("sis") || r.includes("sibling")) return "sibling";
  if (r && !r.startsWith("fa")) return "guardian";
  return "father";
};

export interface CheckedRow {
  /** Row number in the file, counting the header as row 1. */
  line: number;
  name: string;
  placement: string;
  errors: string[];
  input?: AdmissionInput;
  raw: string[];
}

interface CheckContext {
  branchId: string;
  classes: SchoolClass[];
  sections: Section[];
  students: Student[];
  today: string;
}

/** Checks every data row and builds admissions for the ones that pass. */
export function checkRows(rows: string[][], map: Record<ImportField, number>, ctx: CheckContext): CheckedRow[] {
  const seenBForms = new Map<string, number>();
  const seenNameDob = new Map<string, number>();

  return rows.map((raw, i) => {
    const line = i + 2;
    const get = (f: ImportField) => (map[f] >= 0 ? (raw[map[f]] ?? "").trim() : "");
    const errors: string[] = [];

    const firstName = get("firstName");
    const lastName = get("lastName");
    const name = `${firstName} ${lastName}`.trim();
    if (firstName.length < 2) errors.push("First name is missing");
    if (lastName.length < 2) errors.push("Last name is missing");

    const dob = parseDate(get("dateOfBirth"));
    if (!dob) errors.push("Date of birth should look like 2014-03-14 or 14/03/2014");
    else {
      const age = (new Date(ctx.today).getTime() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 2.5 || age > 22) errors.push("Date of birth gives an age outside 3 to 22");
    }

    const gender = parseGender(get("gender"));
    if (!gender) errors.push("Gender should be Male or Female");

    const classText = get("className").toLowerCase().replace(/^class\s*/, "").replace(/[^a-z0-9 ]/g, "").trim();
    const cls = ctx.classes.find((c) => c.branchId === ctx.branchId && (c.name.toLowerCase() === get("className").toLowerCase() || c.name.toLowerCase() === `class ${classText}`));
    if (!cls) errors.push(get("className") ? `There's no ${get("className")} at this campus` : "Class is missing");
    const sectionText = get("section").toLowerCase().replace(/^section\s*/, "").trim();
    const section = cls ? ctx.sections.find((s) => s.classId === cls.id && s.name.toLowerCase() === sectionText) : undefined;
    if (cls && !section) errors.push(sectionText ? `${cls.name} has no section ${sectionText.toUpperCase()}` : "Section is missing");

    const bFormRaw = get("bForm");
    const bForm = bFormRaw ? maskCnic(bFormRaw) : "";
    if (bForm && !CNIC_PATTERN.test(bForm)) errors.push("B-form should have 13 digits");
    else if (bForm) {
      const existing = ctx.students.find((s) => s.bForm === bForm);
      if (existing) errors.push(`B-form already enrolled: ${existing.name} (${existing.id})`);
      else if (seenBForms.has(bForm)) errors.push(`Same B-form as row ${seenBForms.get(bForm)}`);
      else seenBForms.set(bForm, line);
    }
    if (dob && name.length > 3) {
      const key = `${name.toLowerCase()}|${dob}`;
      const existing = ctx.students.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.dateOfBirth === dob);
      if (existing) errors.push(`Looks already enrolled: ${existing.name} (${existing.id}), same date of birth`);
      else if (seenNameDob.has(key)) errors.push(`Same student as row ${seenNameDob.get(key)}`);
      else seenNameDob.set(key, line);
    }

    const guardianName = get("guardianName");
    if (guardianName.length < 3) errors.push("Father or guardian name is missing");
    const phone = maskMobile(get("guardianPhone"));
    if (!MOBILE_PATTERN.test(phone)) errors.push(get("guardianPhone") ? "Guardian mobile should be like 0300-1234567" : "Guardian mobile is missing");
    const cnicRaw = get("guardianCnic");
    const cnic = cnicRaw ? maskCnic(cnicRaw) : "";
    if (cnic && !CNIC_PATTERN.test(cnic)) errors.push("Guardian CNIC should have 13 digits");

    const admissionRaw = get("admissionDate");
    const admissionDate = admissionRaw ? parseDate(admissionRaw) : ctx.today;
    if (!admissionDate) errors.push("Admission date should look like 2026-04-01");

    const feeRaw = get("monthlyFee").replace(/[,\s]|rs\.?/gi, "");
    const fee = feeRaw ? Number(feeRaw) : 3000;
    if (!Number.isInteger(fee) || fee < 0) errors.push("Monthly fee should be a whole number");

    const row: CheckedRow = {
      line,
      name: name || "(no name)",
      placement: cls ? `${cls.name}${section ? `, section ${section.name}` : ""}` : get("className"),
      errors,
      raw,
    };
    if (errors.length === 0 && cls && section && dob && gender && admissionDate) {
      row.input = {
        name,
        email: "",
        ...(bForm ? { bForm } : {}),
        dateOfBirth: dob,
        gender,
        ...(get("bloodGroup") ? { bloodGroup: get("bloodGroup").toUpperCase() } : {}),
        address: get("address"),
        ...(get("previousSchool") ? { previousSchool: get("previousSchool") } : {}),
        admissionDate,
        branchId: ctx.branchId,
        classId: cls.id,
        sectionId: section.id,
        electiveSubjectIds: [],
        guardians: [
          {
            id: `g-import-${line}-${Date.now().toString(36)}`,
            name: guardianName,
            relation: parseRelation(get("guardianRelation")),
            phone,
            ...(cnic ? { cnic } : {}),
            whatsapp: true,
            primary: true,
          },
        ],
        monthlyFee: fee,
        discountPercent: 0,
      };
    }
    return row;
  });
}

/** The rows with problems, with the problems in a last column, ready to fix and import again. */
export const problemsCsv = (headers: string[], rows: CheckedRow[]) =>
  toCsv([[...headers, "Problems"], ...rows.filter((r) => r.errors.length).map((r) => [...r.raw, r.errors.join("; ")])]);
