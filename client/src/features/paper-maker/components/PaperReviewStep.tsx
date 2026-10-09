"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PaperQuestion } from "../types";

const initialQuestions: PaperQuestion[] = [
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

const alternativeQuestionPool: Record<string, PaperQuestion[]> = {
  "q-1": [
    {
      id: "q-1-alt1",
      type: "mcq",
      chapter: "Kinematics",
      marks: 1,
      questionText:
        "The slope of a velocity-time graph represents which physical quantity?",
      options: ["Distance", "Displacement", "Acceleration", "Speed"],
    },
    {
      id: "q-1-alt2",
      type: "mcq",
      chapter: "Kinematics",
      marks: 1,
      questionText:
        "A ball dropped from a height of 20 m reaches the ground in approximately how many seconds? (Take g = 10 m/s²)",
      options: ["1 s", "2 s", "4 s", "5 s"],
    },
  ],
  "q-2": [
    {
      id: "q-2-alt1",
      type: "mcq",
      chapter: "Physical Quantities",
      marks: 1,
      questionText:
        "The least count of a standard Vernier Calipers with 10 vernier divisions is:",
      options: ["0.1 cm", "0.01 cm", "0.001 cm", "1 mm"],
    },
  ],
  "q-3": [
    {
      id: "q-3-alt1",
      type: "short",
      chapter: "Dynamics",
      marks: 3,
      questionText:
        "Differentiate between mass and weight. Mention at least three distinctive characteristics.",
    },
  ],
  "q-4": [
    {
      id: "q-4-alt1",
      type: "short",
      chapter: "Turning Effect of Forces",
      marks: 3,
      questionText:
        "State the two conditions of equilibrium. Give a practical example of a body satisfying both conditions.",
    },
  ],
  "q-5": [
    {
      id: "q-5-alt1",
      type: "long",
      chapter: "Work & Energy",
      marks: 6,
      questionText:
        "Explain the principle of conservation of energy. Differentiate between renewable and non-renewable energy sources with two examples of each.",
    },
  ],
};

interface PaperReviewStepProps {
  questions: PaperQuestion[];
  onUpdateQuestions: (questions: PaperQuestion[]) => void;
}

export function PaperReviewStep({
  questions = initialQuestions,
  onUpdateQuestions,
}: PaperReviewStepProps) {
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const handleSwapQuestion = (questionId: string) => {
    setSwappingId(questionId);

    setTimeout(() => {
      const alternatives = alternativeQuestionPool[questionId] || [];
      if (alternatives.length > 0) {
        const randomReplacement =
          alternatives[Math.floor(Math.random() * alternatives.length)];

        const updated = questions.map((q) =>
          q.id === questionId ? { ...randomReplacement, id: questionId } : q
        );
        onUpdateQuestions(updated);
      }
      setSwappingId(null);
    }, 450);
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
                <ListOrdered className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Step 2: Review & Customize Question Bank
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Inspect generated questions. Tap Swap/Regenerate to replace any question instantly.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                <span>{questions.length} Questions</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 font-bold">{totalMarks} Total Marks</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {questions.map((q, idx) => {
            const isSwapping = swappingId === q.id;

            return (
              <div
                key={q.id}
                className="group relative rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white font-mono">
                        Q{idx + 1}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200/60">
                        {q.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Unit: {q.chapter}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 ml-auto sm:ml-0">
                        [{q.marks} {q.marks === 1 ? "Mark" : "Marks"}]
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options for MCQ */}
                    {q.options && (
                      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70"
                          >
                            <span className="font-mono font-bold text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap / Regenerate Button */}
                  <div className="shrink-0 self-end sm:self-start pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwapQuestion(q.id)}
                      disabled={isSwapping}
                      className="h-8 gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-xs transition-colors"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 text-slate-500 ${
                          isSwapping ? "animate-spin text-blue-600" : ""
                        }`}
                      />
                      <span>{isSwapping ? "Swapping..." : "Swap / Regenerate"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

