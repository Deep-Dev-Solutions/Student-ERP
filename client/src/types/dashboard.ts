export type RegisterStatus = "locked" | "pending" | "not_marked";

export interface SectionRegister {
  section: string;
  status: RegisterStatus;
  present: number;
  enrolled: number;
}

export interface FeeMonth {
  month: string;
  collected: number;
  current?: boolean;
}

export interface AttendanceDay {
  date: string;
  rate: number;
}
