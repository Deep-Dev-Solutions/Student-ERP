/*
 * Dashboard figures. The dashboard widgets are Server Components, which can't
 * use RTK Query hooks, so they read from here. Replace these with server-side
 * API calls when the backend exists.
 */
export {
  attendanceTrend,
  feeCollection,
  feeTarget,
  registerSummary,
  studentsSummary,
  todayRegister,
} from "@/mocks/dashboard";
