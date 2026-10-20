"use client";

import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, Eye, PackageX } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useModules, useSignedInUser } from "@/hooks/use-session";
import { moduleForPath, moduleName } from "@/lib/modules";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { stoppedViewingAs } from "@/store/sessionSlice";

/** Shown while a platform admin has a school open as its owner. */
export function ViewAsBanner() {
  const user = useSignedInUser();
  const viewAs = useAppSelector((s) => s.session.viewAsTenantId);
  const { tenant } = useModules();
  const dispatch = useAppDispatch();
  const router = useRouter();
  if (user?.role !== "super_admin" || !viewAs || !tenant) return null;
  return (
    <div role="status" className="mb-4 flex flex-col gap-2 rounded-lg border border-info/30 bg-info-tint p-3 text-sm text-info sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="flex items-center gap-2">
        <Eye aria-hidden className="size-4 shrink-0" />
        Viewing {tenant.name} as its owner, {tenant.owner.name}. You see only the modules on its plan.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          dispatch(stoppedViewingAs());
          router.push(`/console/${tenant.id}`);
        }}
      >
        Back to console
      </Button>
    </div>
  );
}

function Gate({ children, pathname, padded }: { children: React.ReactNode; pathname: string; padded?: boolean }) {
  const { tenant, has } = useModules();
  const key = moduleForPath(pathname);
  const wrap = (node: React.ReactNode) => (padded ? <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{node}</div> : node);
  if (tenant?.status === "suspended") {
    return wrap(
      <Card className="py-0">
        <EmptyState icon={Ban} title={`${tenant.name} is suspended`} description="Access to the school's records is paused. Contact DeepDev support to restore it; nothing has been deleted." />
      </Card>
    );
  }
  if (key && !has(key)) {
    return wrap(
      <Card className="py-0">
        <EmptyState
          icon={PackageX}
          title="This isn't part of your plan"
          description={`${moduleName(key)} isn't included in ${tenant?.name ?? "your school"}'s plan. Contact DeepDev to add it.`}
          action={<ButtonLink href="/dashboard">Go to the dashboard</ButtonLink>}
        />
      </Card>
    );
  }
  return <>{children}</>;
}

function PathGate({ children, padded }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <Gate pathname={usePathname()} padded={padded}>
      {children}
    </Gate>
  );
}

/**
 * Hides pages of modules the school doesn't have, and everything while the
 * school is suspended. UI only: the backend refuses those API calls too.
 */
export function PlanGate({ children, padded }: { children: React.ReactNode; padded?: boolean }) {
  // Dynamic routes don't know the path while prerendering; the school's plan isn't loaded then either.
  return (
    <Suspense fallback={children}>
      <PathGate padded={padded}>{children}</PathGate>
    </Suspense>
  );
}

/** Renders its children only when the school has the module. */
export function ModuleOnly({ module, children }: { module: Parameters<ReturnType<typeof useModules>["has"]>[0]; children: React.ReactNode }) {
  const { has } = useModules();
  return has(module) ? <>{children}</> : null;
}
