"use client";

import { useId, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormStatus, SelectField } from "@/components/shared/FormFields";
import { useReadOnly } from "@/hooks/use-academics";
import { useCurrentBranch } from "@/hooks/use-session";
import { downloadFile, parseCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { errorMessage, useGetClassesQuery, useGetSectionsQuery, useGetStudentsQuery, useImportStudentsMutation } from "@/store/api";
import { autoMap, checkRows, IMPORT_FIELDS, problemsCsv, templateCsv, type CheckedRow, type ImportField } from "../importRows";

const steps = [
  { title: "Upload", hint: "Your spreadsheet" },
  { title: "Match columns", hint: "Which column is which" },
  { title: "Check rows", hint: "Fix or skip problems" },
  { title: "Done", hint: "Students added" },
];

const NOT_IN_FILE = "-1";
const MAX_BYTES = 10 * 1024 * 1024;

const guidelines = [
  { title: "Start from the template", body: "Or use your own sheet: you'll match its columns in the next step." },
  { title: "Save it as CSV", body: "In Excel, choose File, Save As, then CSV UTF-8. Urdu names stay intact." },
  { title: "Nothing is saved until you confirm", body: "Every row is checked first, and rows with problems can be downloaded to fix." },
];

export function ImportWizard() {
  const inputId = useId();
  const branch = useCurrentBranch();
  const readOnly = useReadOnly();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const [importStudents, { isLoading }] = useImportStudentsMutation();

  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<ImportField, number> | null>(null);
  const [checked, setChecked] = useState<CheckedRow[]>([]);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ready = checked.filter((r) => r.input);
  const problems = checked.filter((r) => r.errors.length);
  const missingRequired = map ? IMPORT_FIELDS.filter((f) => f.required && map[f.key] < 0) : [];

  const readFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return setError("Choose a .csv file. In Excel, use File, Save As, CSV UTF-8.");
    if (file.size > MAX_BYTES) return setError("The file is larger than 10 MB. Split it into smaller files.");
    const rows = parseCsv(await file.text());
    if (rows.length < 2) return setError("The file needs a header row and at least one student.");
    setFileName(file.name);
    setHeaders(rows[0].map((h) => h.trim()));
    setDataRows(rows.slice(1));
    setMap(autoMap(rows[0]));
    setStep(2);
  };

  const runChecks = () => {
    if (!map || !branch) return;
    if (missingRequired.length) return setError(`Match a column for: ${missingRequired.map((f) => f.label).join(", ")}.`);
    setError(null);
    setChecked(checkRows(dataRows, map, { branchId: branch.id, classes, sections, students, today: new Date().toISOString().slice(0, 10) }));
    setStep(3);
  };

  const runImport = async () => {
    const result = await importStudents(ready.map((r) => r.input!));
    if ("error" in result) return setError(errorMessage(result.error));
    setImported(result.data.length);
    setStep(4);
  };

  const startOver = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setDataRows([]);
    setMap(null);
    setChecked([]);
    setError(null);
  };

  const columnOptions = [{ value: NOT_IN_FILE, label: "Not in my file" }, ...headers.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` }))];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="py-4">
        <ol className="grid grid-cols-4 gap-2 px-4 sm:px-5" aria-label="Steps">
          {steps.map((s, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={s.title} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    state === "todo" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                  )}
                >
                  {state === "done" ? <Check aria-hidden className="size-4" /> : n}
                  {state === "done" ? <span className="sr-only">Step {n}, done</span> : null}
                </span>
                <span className="min-w-0">
                  <span className={cn("hidden truncate text-sm font-medium sm:block", state === "todo" && "text-muted-foreground")}>{s.title}</span>
                  <span className="hidden truncate text-xs text-muted-foreground lg:block">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="px-4 text-sm font-medium sm:hidden">
          Step {step} of {steps.length}: {steps[step - 1].title}
        </p>
      </Card>

      {step === 1 ? (
        <Card className="gap-8 px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-muted/50 px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <UploadCloud aria-hidden className="size-7" />
            </span>
            <h2 className="mt-4 text-base font-semibold">Import students from a spreadsheet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Choose a .csv file up to 10 MB. Students are added to {branch?.name ?? "this campus"}.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" onClick={() => downloadFile("student-import-template.csv", templateCsv())}>
                <FileSpreadsheet data-icon="inline-start" className="text-success" />
                Download template
              </Button>
              <label htmlFor={inputId} className={cn(buttonVariants(), "cursor-pointer", readOnly && "pointer-events-none opacity-50")}>
                Choose file
              </label>
              <input
                id={inputId}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={readOnly}
                onChange={(e) => {
                  readFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {error ? (
              <div className="mt-4">
                <FormStatus error={error} />
              </div>
            ) : null}
          </div>

          <ul className="grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
            {guidelines.map((g) => (
              <li key={g.title} className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-tint text-success">
                  <Check aria-hidden className="size-3.5" />
                </span>
                <div>
                  <h3 className="text-sm font-medium">{g.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{g.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {step === 2 && map ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>Match columns</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">
              {fileName}: {dataRows.length} {dataRows.length === 1 ? "student" : "students"}. Columns with matching names are filled in; check the rest.
            </CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMPORT_FIELDS.map((f) => (
              <SelectField
                key={f.key}
                id={`map-${f.key}`}
                label={f.required ? `${f.label} (required)` : f.label}
                options={columnOptions}
                value={String(map[f.key])}
                onValueChange={(v) => setMap({ ...map, [f.key]: Number(v) })}
                hint={map[f.key] >= 0 && dataRows[0]?.[map[f.key]] ? `First row: ${dataRows[0][map[f.key]]}` : undefined}
              />
            ))}
          </div>
          {error ? <FormStatus error={error} /> : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <CheckCircle2 aria-hidden className="size-5 text-success" />
              <div>
                <p className="text-2xl font-semibold">{ready.length}</p>
                <p className="text-sm text-muted-foreground">ready to import</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <AlertTriangle aria-hidden className={cn("size-5", problems.length ? "text-warning" : "text-muted-foreground")} />
              <div>
                <p className="text-2xl font-semibold">{problems.length}</p>
                <p className="text-sm text-muted-foreground">with problems, skipped</p>
              </div>
            </div>
          </div>

          <Card className="gap-0 py-0">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Rows</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Fix problems in your file and import it again, or import the ready rows now.</p>
              </div>
              {problems.length ? (
                <Button variant="outline" size="sm" onClick={() => downloadFile(`problems-${fileName}`, problemsCsv(headers, checked))}>
                  <Download data-icon="inline-start" />
                  Download rows with problems
                </Button>
              ) : null}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Row</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="pr-5">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...problems, ...ready].map((r) => (
                  <TableRow key={r.line}>
                    <TableCell className="pl-5 text-muted-foreground tabular-nums">{r.line}</TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{r.placement}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.placement || "—"}</TableCell>
                    <TableCell className="pr-5 whitespace-normal">
                      {r.errors.length ? (
                        <ul className="space-y-0.5 text-sm text-danger">
                          {r.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      ) : (
                        <Badge variant="success">Ready</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {error ? <FormStatus error={error} /> : null}
        </div>
      ) : null}

      {step === 4 ? (
        <Card className="items-center gap-4 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-tint text-success">
            <CheckCircle2 aria-hidden className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              {imported} {imported === 1 ? "student" : "students"} imported
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              They have roll IDs and admission numbers, and siblings sharing a guardian&apos;s mobile are linked.
              {problems.length ? ` ${problems.length} rows were skipped.` : ""}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={startOver}>
              Import another file
            </Button>
            <ButtonLink href="/students?sort=id&dir=desc">View students</ButtonLink>
          </div>
        </Card>
      ) : null}

      {step === 2 || step === 3 ? (
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => (step === 2 ? startOver() : setStep(2))}>
            <ArrowLeft data-icon="inline-start" />
            {step === 2 ? "Choose a different file" : "Back to columns"}
          </Button>
          {step === 2 ? (
            <Button onClick={runChecks}>
              Check rows
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button onClick={runImport} disabled={ready.length === 0 || isLoading || readOnly}>
              {isLoading ? "Importing…" : `Import ${ready.length} ${ready.length === 1 ? "student" : "students"}`}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
