"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaperQuestion } from "../types";

const questionTypeLabels: Record<PaperQuestion["type"], string> = {
  mcq: "Multiple choice",
  short: "Short answer",
  long: "Long answer",
};

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
    <Card className="gap-5 px-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>
            <h2>Review the questions</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Swap any question for another one from the same chapter.</CardDescription>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{questions.length}</span> questions ·{" "}
          <span className="font-semibold text-foreground">{totalMarks}</span> marks
        </p>
      </div>

      <ol className="space-y-3">
        {questions.map((q, idx) => {
          const isSwapping = swappingId === q.id;
          const canSwap = (alternativeQuestionPool[q.id] ?? []).length > 0;
          return (
            <li key={q.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">Question {idx + 1}</span>
                    <Badge variant="secondary">{questionTypeLabels[q.type]}</Badge>
                    <span className="text-muted-foreground">{q.chapter}</span>
                    <span className="text-muted-foreground">
                      · {q.marks} {q.marks === 1 ? "mark" : "marks"}
                    </span>
                  </div>

                  <p className="leading-relaxed">{q.questionText}</p>

                  {q.options ? (
                    <ol className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2" type="A">
                      {q.options.map((opt, optIdx) => (
                        <li key={optIdx} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
                          <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSwapQuestion(q.id)}
                  disabled={isSwapping || !canSwap}
                  aria-label={`Swap question ${idx + 1}`}
                  className="self-end sm:self-start"
                >
                  <RefreshCw data-icon="inline-start" className={isSwapping ? "motion-safe:animate-spin" : undefined} />
                  {isSwapping ? "Swapping…" : "Swap"}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
