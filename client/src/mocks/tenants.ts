/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { Branch, Tenant } from "@/types";

/** The demo school every school login belongs to. */
export const DEMO_TENANT_ID = "t-1";

export const tenants: Tenant[] = [
  {
    id: DEMO_TENANT_ID,
    name: "Apex Grammar & Science Academy",
    city: "Lahore",
    status: "active",
    modules: ["students", "fees", "attendance", "staff", "payroll", "exams", "paper_maker", "messages", "reports"],
    studentSeats: 1500,
    owner: { name: "Ahsan Iqbal", email: "owner@erp.com", phone: "0300-1112233" },
    createdAt: "2024-03-01T10:00:00",
    history: [{ at: "2024-03-01T10:00:00", by: "Platform admin", text: "School created with every module." }],
  },
  {
    id: "t-2",
    name: "Bright Future Academy",
    city: "Faisalabad",
    status: "active",
    modules: ["students", "fees", "paper_maker", "messages"],
    studentSeats: 400,
    owner: { name: "Rabia Saleem", email: "rabia@brightfuture.pk", phone: "0321-4455667" },
    createdAt: "2025-08-14T10:00:00",
    history: [{ at: "2025-08-14T10:00:00", by: "Platform admin", text: "School created with Students and admissions, Fees, Paper maker and Messages." }],
  },
  {
    id: "t-3",
    name: "Scholars Paper Hub",
    city: "Multan",
    status: "trial",
    modules: ["paper_maker"],
    studentSeats: 0,
    owner: { name: "Kashif Mehmood", email: "kashif@scholarshub.pk", phone: "0333-7788990" },
    createdAt: "2026-10-01T10:00:00",
    history: [{ at: "2026-10-01T10:00:00", by: "Platform admin", text: "Trial started with Paper maker only." }],
  },
  {
    id: "t-4",
    name: "Crescent Model School",
    city: "Rawalpindi",
    status: "suspended",
    modules: ["students", "fees", "attendance"],
    studentSeats: 600,
    owner: { name: "Farah Naz", email: "farah@crescent.edu.pk", phone: "0345-1239876" },
    createdAt: "2025-01-20T10:00:00",
    history: [
      { at: "2025-01-20T10:00:00", by: "Platform admin", text: "School created with Students and admissions, Fees and Attendance." },
      { at: "2026-09-30T10:00:00", by: "Platform admin", text: "Suspended: subscription not renewed." },
    ],
  },
];

/** First campuses of the other demo schools (the demo school's campuses are in branches.ts). */
export const tenantBranches: Branch[] = [
  { id: "br-t2", tenantId: "t-2", name: "Bright Future Main Campus", code: "BFA", location: "Faisalabad" },
  { id: "br-t3", tenantId: "t-3", name: "Scholars Paper Hub", code: "SPH", location: "Multan" },
  { id: "br-t4", tenantId: "t-4", name: "Crescent Model School", code: "CMS", location: "Rawalpindi" },
];
