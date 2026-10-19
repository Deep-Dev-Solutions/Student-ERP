import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { TeacherPortalShell } from "@/components/layout/TeacherPortalShell";

export const metadata: Metadata = { title: { default: "Teacher portal", template: `%s | ${BRAND.name}` } };

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  return <TeacherPortalShell>{children}</TeacherPortalShell>;
}
