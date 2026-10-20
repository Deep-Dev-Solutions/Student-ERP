"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { formatDate } from "@/lib/format";
import { ALL_MODULES } from "@/lib/modules";
import { useGetTenantsQuery } from "@/store/api";
import { ModuleBadges, TenantStatusBadge } from "./shared";
import { useSeatsUsed } from "./useSeatsUsed";

export function SchoolsList() {
  const { data: tenants = [] } = useGetTenantsQuery();
  const seatsUsed = useSeatsUsed();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = tenants.filter((t) => !q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.owner.email.includes(q));
  const count = (s: string) => tenants.filter((t) => t.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools"
        description="Every school on DeepDev ERP, the modules each one has, and its seats."
        actions={
          <ButtonLink href="/console/new">
            <Plus data-icon="inline-start" />
            Add school
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Schools" value={tenants.length} footer="On the platform" />
        <StatCard label="Active" value={count("active")} footer="Paying schools" />
        <StatCard label="On trial" value={count("trial")} footer="Trying it out" />
        <StatCard label="Suspended" value={count("suspended")} footer="Access paused, data kept" />
      </div>
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-base font-semibold">All schools</h2>
          <div className="relative w-full sm:w-72">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" aria-label="Find a school" placeholder="Name, city or owner email" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 bg-card pl-9" />
          </div>
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={Building2} title="No schools match" description="Try another name, city or email." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">School</TableHead>
                <TableHead className="hidden lg:table-cell">Modules</TableHead>
                <TableHead className="hidden text-right md:table-cell">Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden pr-5 xl:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="min-w-48 pl-5 whitespace-normal">
                    <Link href={`/console/${t.id}`} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                      {t.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t.city}. {t.modules.length === ALL_MODULES.length ? "Every module" : `${t.modules.length} of ${ALL_MODULES.length} modules`}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-md whitespace-normal lg:table-cell">
                    <ModuleBadges modules={t.modules} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {t.modules.includes("students") ? `${seatsUsed(t.id).toLocaleString("en-PK")} / ${t.studentSeats.toLocaleString("en-PK")}` : "—"}
                  </TableCell>
                  <TableCell>
                    <TenantStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="hidden pr-5 xl:table-cell">{formatDate(t.createdAt.slice(0, 10))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
