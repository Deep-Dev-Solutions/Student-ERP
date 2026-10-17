/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import { computePayslip } from "@/lib/payroll";
import type { Advance, PayrollRun, Payslip, StaffMember, TeacherAllocation, TeacherOption } from "@/types";

const hra = (basic: number) => ({ label: "House rent", amount: Math.round(basic * 0.25) });
const conveyance = { label: "Conveyance", amount: 6000 };
const medical = { label: "Medical", amount: 3000 };

type Seed = Pick<StaffMember, "staffId" | "name" | "role" | "department" | "gender" | "teaches" | "basicSalary" | "joinDate"> & Partial<StaffMember>;

const seeds: Seed[] = [
  { staffId: "STF-201", name: "Dr. Tariq Mahmood", role: "Senior Physics Lecturer", department: "Science", gender: "male", teaches: true, basicSalary: 120_000, joinDate: "2021-08-15", qualification: "PhD Physics", phone: "0300-1122334", cnic: "35202-1122334-5" },
  { staffId: "STF-202", name: "Saima Nazir", role: "Head of Mathematics", department: "Mathematics", gender: "female", teaches: true, basicSalary: 110_000, joinDate: "2019-01-10", qualification: "MSc Mathematics", phone: "0321-9988776" },
  { staffId: "STF-203", name: "Rashid Minhas", role: "Chemistry Teacher", department: "Science", gender: "male", teaches: true, basicSalary: 85_000, joinDate: "2022-09-01", qualification: "MSc Chemistry", phone: "0333-4455667", status: "on_leave" },
  { staffId: "STF-204", name: "Ayesha Siddiqua", role: "English Literature Instructor", department: "Humanities", gender: "female", teaches: true, basicSalary: 80_000, joinDate: "2023-03-12", qualification: "MA English", phone: "0312-8899001" },
  { staffId: "STF-205", name: "Kamran Akram", role: "Computer Science Teacher", department: "IT & CS", gender: "male", teaches: true, basicSalary: 90_000, joinDate: "2020-10-05", qualification: "BS Computer Science", phone: "0345-6677889" },
  { staffId: "STF-206", name: "Farhan Ali", role: "Physical Education Coach", department: "Sports", gender: "male", teaches: true, basicSalary: 55_000, joinDate: "2024-02-01", phone: "0301-2233445", status: "terminated", employment: "contract", left: { date: "2026-07-31", reason: "Contract ended" } },
  { staffId: "STF-207", name: "Bilal Ahmed", role: "Mathematics Teacher", department: "Mathematics", gender: "male", teaches: true, basicSalary: 75_000, joinDate: "2024-04-01", qualification: "MSc Mathematics", phone: "0322-5566778" },
  { staffId: "STF-208", name: "Nadia Hussain", role: "Biology Teacher", department: "Science", gender: "female", teaches: true, basicSalary: 78_000, joinDate: "2023-08-20", qualification: "MSc Zoology", phone: "0331-2244668" },
  { staffId: "STF-209", name: "Shazia Parveen", role: "Urdu Teacher", department: "Humanities", gender: "female", teaches: true, basicSalary: 65_000, joinDate: "2018-04-02", qualification: "MA Urdu", phone: "0315-7788990" },
  { staffId: "STF-210", name: "Abdul Rehman", role: "Islamiyat and Pakistan Studies Teacher", department: "Humanities", gender: "male", teaches: true, basicSalary: 62_000, joinDate: "2017-04-03", qualification: "MA Islamic Studies", phone: "0306-1234098", employment: "contract" },
  { staffId: "STF-211", name: "Usman Qureshi", role: "Principal", department: "Administration", gender: "male", teaches: false, basicSalary: 180_000, joinDate: "2016-06-01", qualification: "MEd", phone: "0300-5551234", email: "usman@erp.com" },
  { staffId: "STF-212", name: "Ali Raza", role: "Accountant", department: "Administration", gender: "male", teaches: false, basicSalary: 70_000, joinDate: "2020-01-15", qualification: "ACCA (part)", phone: "0333-9876501", email: "ali@erp.com" },
  { staffId: "STF-213", name: "Sana Javed", role: "Front desk officer", department: "Administration", gender: "female", teaches: false, basicSalary: 48_000, joinDate: "2022-11-01", phone: "0321-1112131", email: "sana@erp.com", employment: "contract" },
  { staffId: "STF-214", name: "Mehwish Aslam", role: "Primary Teacher", department: "Primary", gender: "female", teaches: true, basicSalary: 52_000, joinDate: "2021-04-05", qualification: "BEd", phone: "0302-4455661" },
];

export const staff: StaffMember[] = seeds.map((s, i) => {
  const first = s.name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/, "").split(" ");
  return {
    id: `st-${i + 1}`,
    avatar: `${first[0][0]}${first.at(-1)![0]}`,
    email: `${first[0].toLowerCase()}.${first.at(-1)!.toLowerCase()}@school.edu.pk`,
    status: "active",
    branchId: "br-1",
    employment: "permanent",
    allowances: [hra(s.basicSalary), conveyance, medical],
    address: "Lahore",
    bankAccount: `PK${String(36 + i).padStart(2, "0")}MEZN00${String(1022334455 + i * 7919).padStart(14, "0")}`,
    ...s,
  } as StaffMember;
});

/** Teachers as offered in pickers: teaching staff who haven't left. */
export const teachersFrom = (members: StaffMember[]): TeacherOption[] =>
  members.filter((m) => m.teaches && m.status !== "terminated").map((m) => ({ id: m.staffId, name: m.name, avatar: m.avatar }));

export const teachers: TeacherOption[] = teachersFrom(staff);

/** Who teaches what in classes 9 and 10 at Lahore Central (and a little of class 8). */
const plan: [subjectId: string, teacher: Record<string, string>][] = [
  ["sub-phy", { "10-A": "STF-201", "10-B": "STF-201", "9-B": "STF-201", "9-A": "STF-203", "9-C": "STF-203" }],
  ["sub-chem", { "10-A": "STF-203", "10-B": "STF-203", "9-A": "STF-208", "9-B": "STF-208" }],
  ["sub-math", { "10-A": "STF-202", "10-B": "STF-202", "10-C": "STF-202", "9-A": "STF-207", "9-B": "STF-207", "9-C": "STF-207" }],
  ["sub-eng", { "10-A": "STF-204", "10-B": "STF-204", "10-C": "STF-204", "9-A": "STF-204", "9-B": "STF-204", "9-C": "STF-204", "8-C": "STF-204" }],
  ["sub-cs", { "10-A": "STF-205", "10-B": "STF-205", "9-A": "STF-205", "9-B": "STF-205", "9-C": "STF-205" }],
  ["sub-bio", { "10-A": "STF-208", "10-B": "STF-208", "9-C": "STF-208" }],
  ["sub-urdu", { "10-A": "STF-209", "10-B": "STF-209", "10-C": "STF-209", "9-A": "STF-209", "9-B": "STF-209", "9-C": "STF-209" }],
  ["sub-isl", { "10-A": "STF-210", "10-B": "STF-210", "9-A": "STF-210", "9-B": "STF-210", "9-C": "STF-210" }],
  ["sub-pst", { "10-A": "STF-210", "10-B": "STF-210", "9-A": "STF-210", "9-B": "STF-210" }],
];
const periodsFor = (subjectId: string) => (["sub-urdu", "sub-isl", "sub-pst", "sub-cs", "sub-bio"].includes(subjectId) ? 4 : 6);

export const allocations: TeacherAllocation[] = plan.flatMap(([subjectId, bySection]) =>
  Object.entries(bySection).map(([key, teacherId]) => {
    const [grade, letter] = key.split("-");
    return {
      id: `alc-${key}-${subjectId}`,
      teacherId,
      subjectId,
      classId: `br-1-${grade}`,
      sectionId: `br-1-${grade}-${letter}`,
      weeklyPeriods: periodsFor(subjectId),
    };
  })
);

export const periodsOf = (staffId: string, list: TeacherAllocation[] = allocations) =>
  list.filter((a) => a.teacherId === staffId).reduce((n, a) => n + a.weeklyPeriods, 0);

export const advances: Advance[] = [
  { id: "adv-1", staffId: "STF-205", amount: 30_000, date: "2026-08-20", reason: "Family wedding", monthlyRecovery: 5_000, recovered: 5_000 },
];

/** August and September 2026 are paid; October hasn't been run yet. */
export const payrollRuns: PayrollRun[] = ["2026-08", "2026-09"].map((month) => ({
  id: `run-br-1-${month}`,
  branchId: "br-1",
  month,
  status: "paid",
  createdAt: `${month}-25T10:00:00`,
  createdBy: "Ali Raza (Accountant)",
  finalisedAt: `${month}-27T10:00:00`,
}));

export const payslips: Payslip[] = payrollRuns.flatMap((run) =>
  staff
    .filter((m) => m.status !== "terminated" || (m.left && m.left.date >= `${run.month}-01`))
    .filter((m) => !m.left || m.left.date >= `${run.month}-01`)
    .map((m) =>
      computePayslip(
        m,
        { id: `slip-${run.month}-${m.staffId}`, runId: run.id, month: run.month, status: "paid", paidAt: `${run.month}-28T11:00:00`, method: "bank" },
        { absentDays: 0, adjustments: [], advanceRecovery: run.month === "2026-09" && m.staffId === "STF-205" ? 5_000 : 0, periodsPerWeek: periodsOf(m.staffId) }
      )
    )
);
