"use client";

import { useGetCampusProfileQuery } from "@/store/api";
import { useCurrentBranch } from "@/hooks/use-session";

/** School name, campus and contact details across the top of a printout. */
export function SchoolLetterhead({ title, meta }: { title: string; meta?: React.ReactNode }) {
  const { data: profile } = useGetCampusProfileQuery();
  const branch = useCurrentBranch();
  return (
    <header className="flex flex-col gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground print:border print:border-foreground print:bg-white print:text-foreground">
          {profile?.schoolName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">{profile?.schoolName}</p>
          <p className="text-xs text-muted-foreground">
            {branch?.name}
            {profile ? `, ${profile.city}. ${profile.contactPhone}, ${profile.contactEmail}` : ""}
          </p>
          {profile?.registrationNumber ? <p className="text-xs text-muted-foreground">Registration {profile.registrationNumber}</p> : null}
        </div>
      </div>
      <div className="sm:text-right">
        <h1 className="text-xl font-semibold whitespace-nowrap">{title}</h1>
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
      </div>
    </header>
  );
}
