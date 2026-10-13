import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground"
        >
          D
        </span>
        <div className="leading-tight">
          <p className="text-lg font-semibold">{BRAND.name}</p>
          <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
