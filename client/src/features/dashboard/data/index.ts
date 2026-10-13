/*
 * Demo data for the admin dashboard. Headline figures are derived from the
 * section register below, so the page reads as one consistent day at one
 * campus. Replace with API data when the backend is wired in.
 */

export type RegisterStatus = "locked" | "pending" | "not_marked";

export interface SectionRegister {
  section: string;
  status: RegisterStatus;
  present: number;
  enrolled: number;
}

const pendingSections = new Set(["4-B", "7-C", "9-A"]);
const notMarkedSections = new Set(["2-C", "10-C"]);

function sectionsFor(grade: number, letters: string[]): SectionRegister[] {
  return letters.map((letter, i) => {
    const section = `${grade}-${letter}`;
    const enrolled = 34 + ((grade * 7 + i * 3) % 6);
    const status: RegisterStatus = pendingSections.has(section)
      ? "pending"
      : notMarkedSections.has(section)
        ? "not_marked"
        : "locked";
    const present = status === "not_marked" ? 0 : enrolled - ((grade + i) % 4);
    return { section, status, present, enrolled };
  });
}

export const todayRegister: SectionRegister[] = [
  ...sectionsFor(1, ["A", "B", "C"]),
  ...sectionsFor(2, ["A", "B", "C"]),
  ...sectionsFor(3, ["A", "B", "C"]),
  ...sectionsFor(4, ["A", "B", "C"]),
  ...sectionsFor(5, ["A", "B", "C"]),
  ...sectionsFor(6, ["A", "B", "C", "D"]),
  ...sectionsFor(7, ["A", "B", "C", "D"]),
  ...sectionsFor(8, ["A", "B", "C"]),
  ...sectionsFor(9, ["A", "B", "C"]),
  ...sectionsFor(10, ["A", "B", "C"]),
];

const markedSections = todayRegister.filter((s) => s.status !== "not_marked");
const presentToday = markedSections.reduce((sum, s) => sum + s.present, 0);
const enrolledInMarked = markedSections.reduce((sum, s) => sum + s.enrolled, 0);
const countBy = (status: RegisterStatus) =>
  todayRegister.filter((s) => s.status === status).length;

export const registerSummary = {
  sections: todayRegister.length,
  locked: countBy("locked"),
  pending: countBy("pending"),
  notMarked: countBy("not_marked"),
  present: presentToday,
  enrolledInMarked,
  /** Attendance rate across sections that have been marked today. */
  rate: Math.round((presentToday / enrolledInMarked) * 1000) / 10,
};

export const feeTarget = {
  month: "October",
  collected: 1_250_000,
  target: 1_660_000,
  overdueAmount: 145_000,
  overdueVouchers: 120,
};

export interface FeeMonth {
  month: string;
  collected: number;
  current?: boolean;
}

/** Monthly collections this academic year; the current month is to date. */
export const feeCollection: FeeMonth[] = [
  { month: "Apr", collected: 1_580_000 },
  { month: "May", collected: 1_610_000 },
  { month: "Jun", collected: 1_490_000 },
  { month: "Jul", collected: 1_380_000 },
  { month: "Aug", collected: 1_620_000 },
  { month: "Sep", collected: 1_550_000 },
  { month: "Oct", collected: 1_250_000, current: true },
];

export interface AttendanceDay {
  date: string;
  rate: number;
}

/** Daily attendance for the last 22 school days, oldest first. */
export const attendanceTrend: AttendanceDay[] = [
  ["15 Sep", 93.1], ["16 Sep", 94.0], ["17 Sep", 93.6], ["18 Sep", 91.8], ["19 Sep", 92.5],
  ["22 Sep", 94.4], ["23 Sep", 95.1], ["24 Sep", 94.2], ["25 Sep", 93.0], ["26 Sep", 90.6],
  ["29 Sep", 93.8], ["30 Sep", 94.6], ["1 Oct", 93.9], ["2 Oct", 92.7], ["3 Oct", 89.4],
  ["6 Oct", 92.9], ["7 Oct", 93.5], ["8 Oct", 94.1], ["9 Oct", 91.2], ["10 Oct", 90.8],
  ["11 Oct", 93.0], ["13 Oct", registerSummary.rate],
].map(([date, rate]) => ({ date: date as string, rate: rate as number }));

export const studentsSummary = {
  total: todayRegister.reduce((sum, s) => sum + s.enrolled, 0),
  admittedThisMonth: 12,
};

export function formatRupees(value: number) {
  if (value >= 1_000_000) return `Rs ${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1_000) return `Rs ${Math.round(value / 1_000)}K`;
  return `Rs ${value}`;
}
