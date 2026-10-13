export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface AcademicSession {
  id: string;
  /** e.g. "2026-2027" */
  label: string;
  startDate: string;
  endDate: string;
  /** The session new records go into. Exactly one is current. */
  current: boolean;
}
