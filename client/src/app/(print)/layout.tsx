import { PlanGate } from "@/components/layout/PlanGate";

/** Printable pages: no app chrome, white paper, A4 margins. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex-1 bg-card text-foreground print:bg-white">
      <style>{`@page { size: A4; margin: 12mm; }`}</style>
      <PlanGate>{children}</PlanGate>
    </main>
  );
}
