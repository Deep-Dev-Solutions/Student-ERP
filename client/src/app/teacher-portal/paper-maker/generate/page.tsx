"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import {
  PaperScopeStep,
  PaperReviewStep,
  PaperExportStep,
} from "@/features/paper-maker/components";
import { useGetPaperQuestionsQuery } from "@/store/api";
import {
  PaperScopeConfig,
  PaperQuestion,
  PaperExportConfig,
} from "@/features/paper-maker/types";

const defaultScopeConfig: PaperScopeConfig = {
  board: "fbise",
  className: "class-10",
  subject: "physics",
  selectedChapters: ["ch-1", "ch-2", "ch-3"],
};

const defaultExportConfig: PaperExportConfig = {
  testDate: "",
  totalTime: "60 Minutes",
  totalMarks: 25,
  institutionHeader: "Apex Grammar & Science Academy, Secondary Campus",
  instructions:
    "Attempt all sections. Write clearly. Use of non-programmable scientific calculator is permitted.",
};

const steps = [
  { title: "Scope", hint: "Board, class and chapters" },
  { title: "Questions", hint: "Review and edit" },
  { title: "Export", hint: "Header and PDF" },
];

export default function PaperMakerWizardPage() {
  const { data: defaultQuestions = [] } = useGetPaperQuestionsQuery();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [scopeConfig, setScopeConfig] = useState<PaperScopeConfig>(defaultScopeConfig);
  const [questions, setQuestions] = useState<PaperQuestion[]>(defaultQuestions);
  // Today's date is read at render time, not when the module loads.
  const [exportConfig, setExportConfig] = useState<PaperExportConfig>(() => ({
    ...defaultExportConfig,
    testDate: new Date().toISOString().split("T")[0],
    totalMarks: defaultQuestions.reduce((sum, q) => sum + q.marks, 0),
  }));

  const totalSteps = steps.length;

  const goTo = (step: number) => {
    setCurrentStep(step);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Make an exam paper"
        description="Pick the chapters, review the questions, then export a printable paper."
      />

      <Card className="py-4">
        <ol className="grid grid-cols-3 gap-2 px-4 sm:px-5" aria-label="Steps">
          {steps.map((step, i) => {
            const n = i + 1;
            const state = n < currentStep ? "done" : n === currentStep ? "current" : "todo";
            return (
              <li key={step.title} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2.5">
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
                  <span className={cn("block truncate text-sm font-medium", state === "todo" && "text-muted-foreground")}>
                    {step.title}
                  </span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">{step.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      <div>
        {currentStep === 1 && (
          <PaperScopeStep config={scopeConfig} onChange={(updated) => setScopeConfig((prev) => ({ ...prev, ...updated }))} />
        )}
        {currentStep === 2 && <PaperReviewStep questions={questions} onUpdateQuestions={setQuestions} />}
        {currentStep === 3 && (
          <PaperExportStep config={exportConfig} onChange={(updated) => setExportConfig((prev) => ({ ...prev, ...updated }))} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={() => goTo(currentStep - 1)} disabled={currentStep === 1}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={() => goTo(currentStep + 1)}>
            Next: {steps[currentStep].title.toLowerCase()}
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => goTo(1)}>
            Start a new paper
          </Button>
        )}
      </div>
    </div>
  );
}
