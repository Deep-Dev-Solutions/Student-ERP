import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Check } from "lucide-react";

export function BulkImport() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="rounded-xl border border-slate-200/80 bg-white p-10 shadow-xs">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-12 text-center transition-all hover:border-blue-400 hover:bg-blue-50/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Upload Student Registry Excel / CSV
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
            Drag and drop your spreadsheet here, or click to browse from your computer. Supports .xlsx and .csv formats up to 10MB.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              Download Blank Template (.xlsx)
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium">
              Browse File
            </Button>
          </div>
        </div>

        {/* Guidelines Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">
                Standard Headers
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Keep column headers unmodified as defined in the template.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">
                Phone Number Format
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Include 11-digit numbers (e.g. 03001234567) for WhatsApp dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">
                Auto-Deduplication
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Existing Roll IDs are flagged and verified before database insert.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

