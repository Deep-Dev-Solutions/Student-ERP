"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupees } from "@/lib/format";
import type { ReportColumn, ReportResult, ReportRow } from "../definitions";

export function formatCell(col: ReportColumn, value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") return col.kind && col.kind !== "text" ? "—" : "";
  if (typeof value === "string") return value;
  if (col.kind === "money") return formatRupees(value);
  if (col.kind === "percent") return `${value}%`;
  return formatNumber(value);
}

/** A report's rows with an optional total line. Wide reports scroll sideways inside the card. */
export function ReportTable({ report, print = false }: { report: ReportResult; print?: boolean }) {
  const align = (c: ReportColumn) => (c.kind && c.kind !== "text" ? "text-right tabular-nums" : "");
  const edge = (i: number) => (i === 0 ? (print ? "pl-0" : "pl-5") : i === report.columns.length - 1 ? (print ? "pr-0" : "pr-5") : "");
  return (
    <div data-allow-scroll>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {report.columns.map((c, i) => (
              <TableHead key={c.key} className={`${align(c)} ${edge(i)}`}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((row, r) => (
            <TableRow key={r}>
              {report.columns.map((c, i) => (
                <TableCell key={c.key} className={`${align(c)} ${edge(i)} ${i === 0 ? "font-medium" : ""}`}>
                  {formatCell(c, row[c.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {report.total ? (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              {report.columns.map((c, i) => (
                <TableCell key={c.key} className={`font-semibold ${align(c)} ${edge(i)}`}>
                  {formatCell(c, report.total![c.key])}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}
