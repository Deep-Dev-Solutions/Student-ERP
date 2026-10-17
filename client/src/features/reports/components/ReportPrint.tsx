"use client";

import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { SchoolLetterhead } from "@/features/students/components/print/SchoolLetterhead";
import { useReportData } from "../useReportData";
import { reportHeading, useReportSelection } from "./ReportsHub";
import { ReportTable } from "./ReportTable";

export function ReportPrint() {
  const data = useReportData();
  const { report, params, exams } = useReportSelection(data);
  if (!data) return null;
  const result = report.build(data, params);
  const heading = reportHeading(report, params, exams.find((e) => e.id === params.examId)?.title);
  const printedOn = new Date(`${data.today}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <PrintToolbar backHref={`/reports?report=${report.id}`} backLabel="Back to reports" />
      <article className="mx-auto max-w-[297mm] space-y-5 p-6 text-sm sm:p-10 print:max-w-none print:p-0">
        <SchoolLetterhead title={report.title} meta={<>Printed {printedOn}</>} />
        <div>
          <h2 className="text-base font-semibold">{heading}</h2>
          <p className="text-muted-foreground">{report.description}</p>
        </div>
        {result.rows.length ? <ReportTable report={result} print /> : <p>{result.empty ?? "There's no data for this report yet."}</p>}
      </article>
    </>
  );
}
