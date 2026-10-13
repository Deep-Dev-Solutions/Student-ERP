"use client";

import { useId, useState } from "react";
import { Check, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const guidelines = [
  {
    title: "Keep the template headers",
    body: "Don't rename or reorder the columns in the template.",
  },
  {
    title: "Use 11-digit phone numbers",
    body: "For example 03001234567, so WhatsApp messages reach guardians.",
  },
  {
    title: "Duplicates are flagged",
    body: "Existing roll IDs are listed for review before anything is saved.",
  },
];

export function BulkImport() {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="gap-8 px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-muted/50 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <UploadCloud aria-hidden className="size-7" />
          </span>
          <h2 className="mt-4 text-base font-semibold">Import students from a spreadsheet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Choose an .xlsx or .csv file up to 10 MB, based on the template.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline">
              <FileSpreadsheet data-icon="inline-start" className="text-success" />
              Download template
            </Button>
            <label htmlFor={inputId} className={cn(buttonVariants(), "cursor-pointer")}>
              Choose file
            </label>
            <input
              id={inputId}
              type="file"
              accept=".xlsx,.csv"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file ? (
            <p className="mt-4 text-sm" aria-live="polite">
              Selected <span className="font-medium">{file.name}</span>{" "}
              <span className="text-muted-foreground">({Math.ceil(file.size / 1024)} KB)</span>
            </p>
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
    </div>
  );
}
