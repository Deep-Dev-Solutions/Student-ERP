/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { Gender, Guardian, Student, StudentActivity } from "@/types";

const father = (id: string, name: string, phone: string, cnic?: string, occupation?: string): Guardian => ({
  id,
  name,
  relation: "father",
  phone,
  whatsapp: true,
  primary: true,
  ...(cnic ? { cnic } : {}),
  ...(occupation ? { occupation } : {}),
});

const base = {
  branchId: "br-1",
  religion: "Islam",
  electiveSubjectIds: [] as string[],
  siblingIds: [] as string[],
  monthlyFee: 3000,
  discountPercent: 0,
  enrollment: "active" as const,
  documents: [],
};

/** The five students the rest of the demo data (vouchers, marks) refers to. */
const featured: Student[] = [
  {
    ...base,
    id: "STD-1042",
    admissionNo: "ADM-2024-0311",
    admissionDate: "2024-04-08",
    name: "Ahmed Khan",
    email: "ahmed.k@student.edu",
    avatar: "AK",
    bForm: "35202-4567812-3",
    dateOfBirth: "2011-03-14",
    gender: "male",
    bloodGroup: "B+",
    address: "House 21, Street 4, Gulberg III, Lahore",
    previousSchool: "City Grammar School",
    classId: "br-1-9",
    sectionId: "br-1-9-A",
    electiveSubjectIds: ["sub-cs"],
    guardians: [
      father("g-1042-1", "Muhammad Khan", "0300-1234567", "35202-1234567-1", "Shopkeeper"),
      { id: "g-1042-2", name: "Nasreen Khan", relation: "mother", phone: "0301-7654321", whatsapp: false, primary: false },
    ],
    siblingIds: ["STD-1060"],
    feeStatus: "clear",
    attendance: 94,
    balance: 0,
    documents: [
      { id: "doc-1042-1", name: "B-form", kind: "b_form", fileName: "ahmed-bform.pdf", sizeKb: 412, uploadedAt: "2024-04-08" },
      { id: "doc-1042-2", name: "Class 8 result card", kind: "result_card", fileName: "class8-result.jpg", sizeKb: 860, uploadedAt: "2024-04-08" },
    ],
  },
  {
    ...base,
    id: "STD-1043",
    admissionNo: "ADM-2023-0198",
    admissionDate: "2023-04-03",
    name: "Fatima Ali",
    email: "fatima.ali@student.edu",
    avatar: "FA",
    bForm: "35201-9988776-4",
    dateOfBirth: "2010-07-22",
    gender: "female",
    bloodGroup: "O+",
    address: "Flat 3B, Askari 10, Lahore Cantt",
    classId: "br-1-10",
    sectionId: "br-1-10-B",
    electiveSubjectIds: ["sub-bio"],
    guardians: [father("g-1043-1", "Ali Asghar", "0333-7654321", "35201-7654321-9", "Driver")],
    feeStatus: "defaulter",
    attendance: 88,
    balance: 6_000,
  },
  {
    ...base,
    id: "STD-1044",
    admissionNo: "ADM-2024-0326",
    admissionDate: "2024-04-10",
    name: "Muhammad Bilal",
    email: "m.bilal@student.edu",
    avatar: "MB",
    dateOfBirth: "2011-01-05",
    gender: "male",
    bloodGroup: "A+",
    address: "House 7, Block C, Faisal Town, Lahore",
    classId: "br-1-9",
    sectionId: "br-1-9-A",
    electiveSubjectIds: ["sub-bio"],
    guardians: [father("g-1044-1", "Bilal Tariq", "0321-9876543")],
    feeStatus: "clear",
    attendance: 98,
    balance: 0,
  },
  {
    ...base,
    id: "STD-1045",
    admissionNo: "ADM-2023-0204",
    admissionDate: "2023-04-04",
    name: "Ayesha Noor",
    email: "ayesha.n@student.edu",
    avatar: "AN",
    dateOfBirth: "2010-11-30",
    gender: "female",
    bloodGroup: "AB+",
    address: "House 88, Model Town Extension, Lahore",
    classId: "br-1-10",
    sectionId: "br-1-10-A",
    electiveSubjectIds: ["sub-cs"],
    guardians: [father("g-1045-1", "Noor Hassan", "0345-5544332")],
    feeStatus: "clear",
    attendance: 91,
    balance: 0,
  },
  {
    ...base,
    id: "STD-1046",
    admissionNo: "ADM-2024-0340",
    admissionDate: "2024-04-15",
    name: "Zainab Tariq",
    email: "zainab.t@student.edu",
    avatar: "ZT",
    dateOfBirth: "2011-05-18",
    gender: "female",
    address: "House 12, Samanabad, Lahore",
    classId: "br-1-9",
    sectionId: "br-1-9-C",
    guardians: [father("g-1046-1", "Tariq Mehmood", "0312-3322110")],
    feeStatus: "pending",
    attendance: 82,
    balance: 3_000,
  },
];

const boys = ["Hamza", "Usman", "Ali", "Saad", "Hassan", "Bilal", "Umar", "Abdullah", "Zain", "Rayyan", "Ibrahim", "Arham", "Daniyal", "Talha", "Shahzaib", "Huzaifa", "Ahmad", "Muneeb"];
const girls = ["Aiman", "Hira", "Maryam", "Sana", "Eman", "Khadija", "Noor", "Areeba", "Mahnoor", "Fizza", "Hafsa", "Laiba", "Anaya", "Zoha", "Iqra", "Rida", "Alishba"];
const surnames = ["Raza", "Iqbal", "Siddiqui", "Butt", "Chaudhry", "Malik", "Qureshi", "Sheikh", "Javed", "Rehman", "Aslam", "Hussain", "Anwar", "Mirza", "Shah"];
const fathers = ["Imran", "Kashif", "Naveed", "Asif", "Shahid", "Khalid", "Waqas", "Faisal", "Rizwan", "Tahir", "Nadeem", "Sajid", "Zahid", "Arif", "Jamil"];
const sectionsOf: Record<number, string> = { 1: "ABC", 2: "ABC", 3: "ABC", 4: "ABC", 5: "ABC", 6: "ABCD", 7: "ABCD", 8: "ABC", 9: "ABC", 10: "ABC" };

/** Thirty-five more students across Lahore Central, generated the same way every time. */
const generated: Student[] = Array.from({ length: 35 }, (_, i) => {
  const n = 1047 + i;
  const gender: Gender = i % 3 === 1 ? "female" : "male";
  const first = gender === "male" ? boys[i % boys.length] : girls[i % girls.length];
  const surname = surnames[(i * 7) % surnames.length];
  const grade = (i % 10) + 1;
  const letters = sectionsOf[grade];
  const letter = letters[(i * 5) % letters.length];
  const fatherName = `${fathers[(i * 4) % fathers.length]} ${surname}`;
  const phone = `03${String(10 + ((i * 13) % 40)).padStart(2, "0")}-${String(4_000_000 + i * 104_729).slice(0, 7)}`;
  const feeStatus = i % 9 === 4 ? "defaulter" : i % 7 === 2 ? "pending" : "clear";
  const fee = grade <= 5 ? 2500 : grade <= 8 ? 2800 : 3000;
  const birthYear = 2026 - grade - 5;
  return {
    ...base,
    id: `STD-${n}`,
    admissionNo: `ADM-${2019 + (i % 7)}-${String(400 + i * 3).padStart(4, "0")}`,
    admissionDate: `${2019 + (i % 7)}-04-${String(1 + (i % 20)).padStart(2, "0")}`,
    name: `${first} ${surname}`,
    email: `${first.toLowerCase()}.${surname[0].toLowerCase()}${n}@student.edu`,
    avatar: `${first[0]}${surname[0]}`,
    dateOfBirth: `${birthYear}-${String(1 + (i % 12)).padStart(2, "0")}-${String(3 + (i % 25)).padStart(2, "0")}`,
    gender,
    address: `House ${10 + i}, ${["Johar Town", "Garden Town", "Township", "Iqbal Town", "Wapda Town"][i % 5]}, Lahore`,
    classId: `br-1-${grade}`,
    sectionId: `br-1-${grade}-${letter}`,
    electiveSubjectIds: grade >= 9 ? [i % 2 ? "sub-bio" : "sub-cs"] : [],
    guardians: [father(`g-${n}-1`, fatherName, phone)],
    monthlyFee: fee,
    feeStatus,
    attendance: 78 + ((i * 11) % 21),
    balance: feeStatus === "defaulter" ? fee * 2 : feeStatus === "pending" ? fee : 0,
  };
});

// Hamza (STD-1060) is Ahmed Khan's younger brother: same father and phone.
const hamza = generated.find((s) => s.id === "STD-1060")!;
Object.assign(hamza, {
  name: "Hamza Khan",
  avatar: "HK",
  email: "hamza.k1060@student.edu",
  gender: "male",
  classId: "br-1-6",
  sectionId: "br-1-6-B",
  electiveSubjectIds: [],
  guardians: featured[0].guardians.map((g) => ({ ...g, id: `${g.id}-sib` })),
  siblingIds: ["STD-1042"],
  address: featured[0].address,
  discountPercent: 10,
} satisfies Partial<Student>);

// One student who has left, so the directory's "Left school" filter has something to show.
const leaver = generated.find((s) => s.id === "STD-1075")!;
Object.assign(leaver, {
  enrollment: "withdrawn",
  withdrawal: { date: "2026-08-30", reason: "relocated", note: "Family moved to Islamabad." },
  feeStatus: "clear",
  balance: 0,
} satisfies Partial<Student>);

export const students: Student[] = [...featured, ...generated];

export const studentActivity: StudentActivity[] = [
  { id: "act-s-1", studentId: "STD-1042", at: "2024-04-08T09:20:00", actor: "Sana Javed (Front desk)", text: "Admitted to Class 7, section A." },
  { id: "act-s-2", studentId: "STD-1042", at: "2026-04-01T08:00:00", actor: "System", text: "Promoted to Class 9, section A." },
  { id: "act-s-3", studentId: "STD-1042", at: "2026-10-03T10:12:00", actor: "Ali Raza (Accountant)", text: "Paid October tuition, Rs 3,000 in cash." },
  { id: "act-s-4", studentId: "STD-1043", at: "2026-10-11T12:40:00", actor: "Ali Raza (Accountant)", text: "Fee reminder sent by SMS to Ali Asghar." },
  { id: "act-s-5", studentId: "STD-1075", at: "2026-08-30T11:00:00", actor: "Usman Qureshi (Principal)", text: "Marked as left: family moved to Islamabad." },
];
