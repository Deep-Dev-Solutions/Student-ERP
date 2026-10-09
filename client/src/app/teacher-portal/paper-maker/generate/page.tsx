"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import {
  PaperScopeStep,
  PaperReviewStep,
  PaperExportStep,
} from "@/features/paper-maker/components";
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
  testDate: new Date().toISOString().split("T")[0],
  totalTime: "60 Minutes",
  totalMarks: 25,
  institutionHeader: "Apex Grammar & Science Academy — Secondary Campus",
  instructions:
    "Attempt all sections. Write clearly. Use of non-programmable scientific calculator is permitted.",
};

const defaultQuestions: PaperQuestion[] = [
  {
    id: "q-1",
    type: "mcq",
    chapter: "Kinematics",
    marks: 1,
    questionText:
      "A car accelerates uniformly from 15 m/s to 35 m/s in 5 seconds. What is its acceleration?",
    options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
  },
  {
    id: "q-2",
    type: "mcq",
    chapter: "Physical Quantities",
    marks: 1,
    questionText:
      "Which of the following is a derived physical quantity in SI system?",
    options: ["Length", "Mass", "Velocity", "Electric Current"],
  },
  {
    id: "q-3",
    type: "short",
    chapter: "Dynamics",
    marks: 3,
    questionText:
      "State Newton's Second Law of Motion and prove that F = ma from first principles.",
  },
  {
    id: "q-4",
    type: "short",
    chapter: "Turning Effect of Forces",
    marks: 3,
    questionText:
      "Define Center of Gravity and explain why racing cars are designed with broad wheelbases and low height.",
  },
  {
    id: "q-5",
    type: "long",
    chapter: "Work & Energy",
    marks: 6,
    questionText:
      "Derive the mathematical expression for Kinetic Energy of a body of mass m moving with velocity v. Also describe how energy is conserved in a simple pendulum.",
  },
];

export default function PaperMakerWizardPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [scopeConfig, setScopeConfig] = useState<PaperScopeConfig>(defaultScopeConfig);
  const [questions, setQuestions] = useState<PaperQuestion[]>(defaultQuestions);
  const [exportConfig, setExportConfig] = useState<PaperExportConfig>(defaultExportConfig);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* 1. Header with Breadcrumb & Back */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/teacher-portal"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Portal</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Exam Paper Generator Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated test paper creation with AI question recommendations and syllabus alignment.
          </p>
        </div>

        <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <Sparkles className="h-3 w-3" /> Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* 2. Top Step Progress Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              1
            </span>
            <span className={currentStep >= 1 ? "text-slate-900" : "text-slate-400"}>
              Scope & Syllabus
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              2
            </span>
            <span className={currentStep >= 2 ? "text-slate-900" : "text-slate-400"}>
              Review Questions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              3
            </span>
            <span className={currentStep === 3 ? "text-slate-900" : "text-slate-400"}>
              Export PDF
            </span>
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 3. Dynamic Step Components */}
      <div>
        {currentStep === 1 && (
          <PaperScopeStep
            config={scopeConfig}
            onChange={(updated) => setScopeConfig((prev) => ({ ...prev, ...updated }))}
          />
        )}

        {currentStep === 2 && (
          <PaperReviewStep
            questions={questions}
            onUpdateQuestions={setQuestions}
          />
        )}

        {currentStep === 3 && (
          <PaperExportStep
            config={exportConfig}
            onChange={(updated) => setExportConfig((prev) => ({ ...prev, ...updated }))}
          />
        )}
      </div>

      {/* 4. Wizard Navigation Bottom Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="h-10 gap-2 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Step
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={handleNext}
            className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs rounded-xl"
          >
            <span>Proceed to Step {currentStep + 1}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setCurrentStep(1)}
            variant="outline"
            className="h-10 gap-2 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Start New Paper
          </Button>
        )}
      </div>
    </div>
  );
}

