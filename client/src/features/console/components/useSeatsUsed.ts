"use client";

import { DEMO_TENANT_ID } from "@/mocks/tenants";
import { useGetStudentsQuery } from "@/store/api";

/**
 * Active students per school. Only the demo school has student records in the
 * mock data, so other schools show 0 until the real API counts them.
 */
export function useSeatsUsed() {
  const { data: students = [] } = useGetStudentsQuery();
  const demo = students.filter((s) => s.enrollment === "active").length;
  return (tenantId: string) => (tenantId === DEMO_TENANT_ID ? demo : 0);
}
