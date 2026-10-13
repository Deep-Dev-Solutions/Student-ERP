"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileDown,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  Building2,
} from "lucide-react";
import { PaperExportConfig } from "../types";

interface PaperExportStepProps {
  config: PaperExportConfig;
  onChange: (updated: Partial<PaperExportConfig>) => void;
}

export function PaperExportStep({ config, onChange }: PaperExportStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState(false);

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPdf(true);
          }, 1200);
  };

  const fieldClass = "h-9 bg-card pl-9";
  const iconClass = "absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground";

  return (
    <Card className="gap-6 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>Paper header and export</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">These details print at the top of the paper.</CardDescription>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="paper-date" className="mb-1.5 block text-sm font-medium">
            Exam date
          </label>
          <div className="relative">
            <Calendar aria-hidden className={iconClass} />
            <Input id="paper-date" type="date" value={config.testDate} onChange={(e) => onChange({ testDate: e.target.value })} className={fieldClass} />
          </div>
        </div>
        <div>
          <label htmlFor="paper-time" className="mb-1.5 block text-sm font-medium">
            Time allowed
          </label>
          <div className="relative">
            <Clock aria-hidden className={iconClass} />
            <Input
              id="paper-time"
              value={config.totalTime}
              placeholder="e.g. 60 minutes"
              onChange={(e) => onChange({ totalTime: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="paper-marks" className="mb-1.5 block text-sm font-medium">
            Total marks
          </label>
          <div className="relative">
            <Award aria-hidden className={iconClass} />
            <Input
              id="paper-marks"
              type="number"
              inputMode="numeric"
              value={config.totalMarks}
              onChange={(e) => onChange({ totalMarks: Number(e.target.value) || 0 })}
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-5">
        <div>
          <label htmlFor="paper-header" className="mb-1.5 block text-sm font-medium">
            School name on the paper
          </label>
          <div className="relative">
            <Building2 aria-hidden className={iconClass} />
            <Input
              id="paper-header"
              value={config.institutionHeader}
              onChange={(e) => onChange({ institutionHeader: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="paper-instructions" className="mb-1.5 block text-sm font-medium">
            Instructions for students
          </label>
          <textarea
            id="paper-instructions"
            rows={3}
            value={config.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
      </div>

      {generatedPdf ? (
        <div role="status" className="flex flex-col gap-3 rounded-lg border border-success/30 bg-success-tint p-4 text-sm text-success sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="block font-semibold">Paper ready</span>
              Print it, or choose “Save as PDF” in the print dialog.
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer data-icon="inline-start" />
            Print paper
          </Button>
        </div>
      ) : null}

      <Button size="lg" onClick={handleGeneratePdf} disabled={isGenerating} className="h-12 w-full text-base">
        {isGenerating ? (
          <>
            <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
            Preparing paper…
          </>
        ) : (
          <>
            <FileDown data-icon="inline-start" />
            Prepare paper for printing
          </>
        )}
      </Button>
    </Card>
  );
}
