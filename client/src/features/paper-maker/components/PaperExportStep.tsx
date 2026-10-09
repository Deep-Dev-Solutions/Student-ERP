"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileDown,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  Sparkles,
  Building2,
  FileCheck,
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
      setTimeout(() => setGeneratedPdf(false), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Step 3: Document Layout & Export
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Set header attributes, timing allowance, and generate the final print-ready PDF exam paper.
                </CardDescription>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3 w-3" /> Ready for Print
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Test Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Examination Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="date"
                  value={config.testDate}
                  onChange={(e) => onChange({ testDate: e.target.value })}
                  className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Total Time */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Allowed Time Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={config.totalTime}
                  placeholder="e.g. 60 Minutes"
                  onChange={(e) => onChange({ totalTime: e.target.value })}
                  className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Total Marks */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Maximum Total Marks
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="number"
                  value={config.totalMarks}
                  onChange={(e) => onChange({ totalMarks: Number(e.target.value) || 0 })}
                  className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Institution Header and Instructions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Institution Header Banner
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={config.institutionHeader}
                  onChange={(e) => onChange({ institutionHeader: e.target.value })}
                  className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Student Instructions & Notes
              </label>
              <Input
                value={config.instructions}
                onChange={(e) => onChange({ instructions: e.target.value })}
                className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Success Banner */}
          {generatedPdf && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Paper Generated Successfully!</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Your formatted exam question paper has been compiled to PDF with answer keys.
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 text-xs bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Now
              </Button>
            </div>
          )}

          {/* Massive Solid Blue Primary Button */}
          <div className="pt-2">
            <Button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 rounded-2xl gap-3 transition-transform active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-5 w-5 animate-spin" />
                  Compiling High-Resolution PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-5 w-5" />
                  Generate Official Question Paper PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

