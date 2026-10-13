"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetAlternativeQuestionsQuery } from "@/store/api";
import { PaperQuestion } from "../types";

const questionTypeLabels: Record<PaperQuestion["type"], string> = {
  mcq: "Multiple choice",
  short: "Short answer",
  long: "Long answer",
};

interface PaperReviewStepProps {
  questions: PaperQuestion[];
  onUpdateQuestions: (questions: PaperQuestion[]) => void;
}

export function PaperReviewStep({
  questions,
  onUpdateQuestions,
}: PaperReviewStepProps) {
  const { data: alternativeQuestionPool = {} } = useGetAlternativeQuestionsQuery();
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
