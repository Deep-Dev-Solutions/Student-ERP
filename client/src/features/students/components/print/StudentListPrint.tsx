"use client";

import { useSyncExternalStore } from "react";
import { formatDate } from "@/lib/format";
import { useStudentDirectory, genderFilterOptions, statusFilterOptions } from "../../useStudentDirectory";
import { primaryGuardian, studentStatus, studentStatusLabels } from "../../status";
import { PrintToolbar } from "./PrintToolbar";
import { SchoolLetterhead } from "./SchoolLetterhead";
import { localISODate } from "@/lib/dates";

const noSubscribe = () => () => {};
const todayIso = () => localISODate();

/** The student directory, with the filters and sort it was opened with, laid out for paper. */
export function StudentListPrint() {
  const { view, filters, classes, sections, placement } = useStudentDirectory();
  const printedOn = useSyncExternalStore(noSubscribe, todayIso, () => "");
  const rows = view.sorted;

  const describe = [
    filters.classFilter !== "all" ? classes.find((c) => c.id === filters.classFilter)?.name : "All classes",
    filters.sectionFilter !== "all" ? `section ${sections.find((s) => s.id === filters.sectionFilter)?.name}` : null,
    filters.genderFilter !== "all" ? genderFilterOptions.find((o) => o.value === filters.genderFilter)?.label.toLowerCase() : null,
    statusFilterOptions.find((o) => o.value === filters.statusFilter)?.label.toLowerCase(),
    filters.query ? `matching "${filters.query}"` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const backHref = `/students${search}`;

  return (
    <>
      <PrintToolbar backHref={backHref} backLabel="Back to students" />
      <article className="mx-auto max-w-[210mm] space-y-5 p-6 text-sm sm:p-10 print:max-w-none print:p-0">
        <SchoolLetterhead
          title="Student list"
          meta={
            <>
              {describe}
              <br />
              {rows.length} {rows.length === 1 ? "student" : "students"}
              {printedOn ? `, printed ${formatDate(printedOn)}` : ""}
            </>
          }
        />
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-foreground/50 text-[0.7rem] text-muted-foreground">
                <th className="py-1.5 pr-2 font-normal">#</th>
                <th className="py-1.5 pr-2 font-normal">Roll ID</th>
                <th className="py-1.5 pr-2 font-normal">Name</th>
                <th className="py-1.5 pr-2 font-normal">Class</th>
                <th className="py-1.5 pr-2 font-normal">Father or guardian</th>
                <th className="py-1.5 pr-2 font-normal">Mobile</th>
                <th className="py-1.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const p = placement(s);
                const g = primaryGuardian(s);
                return (
                  <tr key={s.id} className="break-inside-avoid border-b border-border">
                    <td className="py-1.5 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{s.id}</td>
                    <td className="py-1.5 pr-2 font-medium">{s.name}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">
                      {p.className.replace("Class ", "")}-{p.sectionName}
                    </td>
                    <td className="py-1.5 pr-2">{g?.name ?? "—"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap tabular-nums">{g?.phone ?? "—"}</td>
                    <td className="py-1.5">{studentStatusLabels[studentStatus(s)]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
