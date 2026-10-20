import type { Metadata } from "next";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: { default: "Platform console", template: `%s | ${BRAND.name}` } };

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
