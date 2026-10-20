"use client";

import { BarChart3, Download, Printer } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { SelectField, TextField } from "@/components/shared/FormFields";
import { useModules } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { downloadFile, toCsv } from "@/lib/csv";
import { monthLabel } from "@/lib/fees";
import { cn } from "@/lib/utils";
import { REPORTS, type ReportDefinition, type ReportParams } from "../definitions";
import { useReportData } from "../useReportData";
import { ReportTable } from "./ReportTable";

/** Reports for the modules the school has. */
export function useAvailableReports() {
  const { has } = useModules();
  return REPORTS.filter((r) => has(r.module));
}

/** The report, month and exam picked, from the URL. */
export function useReportSelection(data: ReturnType<typeof useReportData>) {
  const available = useAvailableReports();
  const [reportId, setReportId] = useUrlParam("report", available[0]?.id ?? REPORTS[0].id);
  const [monthParam, setMonth] = useUrlParam("month", "");
  const [examParam, setExam] = useUrlParam("exam", "");
  const report: ReportDefinition = available.find((r) => r.id === reportId) ?? available[0] ?? REPORTS[0];
  const exams = data?.exams ?? [];
  const params: ReportParams = {
    month: /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : (data?.today ?? "2026-10-01").slice(0, 7),
    examId: exams.some((e) => e.id === examParam) ? examParam : (exams.find((e) => e.publishedAt)?.id ?? exams[0]?.id ?? ""),
  };
  return { report, params, exams, setReportId, setMonth, setExam };
}

/** "Collections by day, October 2026" */
export function reportHeading(report: ReportDefinition, params: ReportParams, examTitle?: string) {
  const parts = [report.title];
  if (report.params.includes("month")) parts.push(monthLabel(params.month));
  if (report.params.includes("exam") && examTitle) parts.push(examTitle);
  return parts.join(", ");
}

export function ReportsHub() {
  const data = useReportData();
  const available = useAvailableReports();
  const groups = [...new Set(available.map((r) => r.group))];
  const { report, params, exams, setReportId, setMonth, setExam } = useReportSelection(data);
  const result = data ? report.build(data, params) : null;
  const examTitle = exams.find((e) => e.id === params.examId)?.title;
  const heading = reportHeading(report, params, examTitle);
  const query = `report=${report.id}${report.params.includes("month") ? `&month=${params.month}` : ""}${report.params.includes("exam") ? `&exam=${params.examId}` : ""}`;

  if (available.length === 0) {
    return (
      <Card className="py-0">
        <EmptyState icon={BarChart3} title="No reports for your modules" description="Reports cover fees, attendance, students, payroll and exams. Add one of those modules to see reports here." />
      </Card>
    );
  }

  const exportCsv = () => {
    if (!result) return;
    downloadFile(
      `${heading.toLowerCase().replace(/\W+/g, "-")}.csv`,
      toCsv([result.columns.map((c) => c.label), ...result.rows.map((r) => result.columns.map((c) => r[c.key])), ...(result.total ? [result.columns.map((c) => result.total![c.key])] : [])])
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Reports" className="hidden lg:block">
        <Card className="gap-4 px-3 py-4">
          {groups.map((g) => (
            <div key={g}>
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{g}</p>
              <ul>
                {available.filter((r) => r.group === g).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setReportId(r.id)}
                      aria-current={r.id === report.id ? "page" : undefined}
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                        r.id === report.id ? "bg-secondary font-medium text-secondary-foreground" : "text-foreground hover:bg-muted"
                      )}
                    >
                      {r.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      </nav>

      <Card className="min-w-0 gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <SelectField
            id="report-pick"
            label="Report"
            className="lg:hidden"
            options={available.map((r) => ({ value: r.id, label: `${r.group}: ${r.title}` }))}
            value={report.id}
            onValueChange={setReportId}
          />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-base font-semibold">{heading}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{report.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={exportCsv} disabled={!result?.rows.length}>
                <Download data-icon="inline-start" />
                Export CSV
              </Button>
              <ButtonLink href={`/print/reports?${query}`} variant="outline" target="_blank">
                <Printer data-icon="inline-start" />
                Print
              </ButtonLink>
            </div>
          </div>
          {report.params.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.params.includes("month") ? <TextField id="report-month" label="Month" type="month" value={params.month} onChange={(e) => e.target.value && setMonth(e.target.value)} /> : null}
              {report.params.includes("exam") ? (
                <SelectField id="report-exam" label="Exam" options={exams.map((e) => ({ value: e.id, label: e.title }))} value={params.examId} onValueChange={setExam} />
              ) : null}
            </div>
          ) : null}
        </div>
        {!result ? (
          <EmptyState icon={BarChart3} title="Loading report" description="Working out the figures." />
        ) : result.rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="Nothing to show" description={result.empty ?? "There's no data for this report yet."} />
        ) : (
          <ReportTable report={result} />
        )}
      </Card>
    </div>
  );
}
