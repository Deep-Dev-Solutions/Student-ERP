/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { AcademicSession, Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "br-1",
    name: "Lahore Central Campus",
    code: "LHR-01",
    location: "Main Boulevard, Gulberg III",
  },
  {
    id: "br-2",
    name: "Gulberg Campus",
    code: "GLB-02",
    location: "Block B, Gulberg II",
  },
  {
    id: "br-3",
    name: "DHA Branch",
    code: "DHA-03",
    location: "Phase 5 Commercial, DHA",
  },
  {
    id: "br-4",
    name: "Johar Town Campus",
    code: "JT-04",
    location: "G-Block, Johar Town",
  },
];

export const sessions: AcademicSession[] = [
  { id: "2026-2027", label: "2026-2027", startDate: "2026-04-01", endDate: "2027-03-31", current: true },
  { id: "2025-2026", label: "2025-2026", startDate: "2025-04-01", endDate: "2026-03-31", current: false },
  { id: "2024-2025", label: "2024-2025", startDate: "2024-04-01", endDate: "2025-03-31", current: false },
];
