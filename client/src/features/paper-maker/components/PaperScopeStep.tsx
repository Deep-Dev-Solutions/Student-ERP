"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetChaptersQuery } from "@/store/api";
import { PaperScopeConfig } from "../types";

const boardOptions = [
  { value: "fbise", label: "Federal Board (FBISE)" },
  { value: "bise-lahore", label: "Lahore Board (BISE)" },
  { value: "cambridge-igcse", label: "Cambridge IGCSE / O Level" },
  { value: "punjab-textbook", label: "Punjab curriculum (PCTB)" },
];
const classOptions = [
  { value: "class-8", label: "Class 8" },
  { value: "class-9", label: "Class 9 (Matric I)" },
  { value: "class-10", label: "Class 10 (Matric II)" },
];
const subjectOptions = [
  { value: "physics", label: "Physics" },
  { value: "mathematics", label: "Mathematics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "computer-science", label: "Computer science" },
];

interface PaperScopeStepProps {
  config: PaperScopeConfig;
  onChange: (updated: Partial<PaperScopeConfig>) => void;
}

export function PaperScopeStep({ config, onChange }: PaperScopeStepProps) {
  const { data: chapters = [] } = useGetChaptersQuery();
  const toggleChapter = (chapterId: string) => {
    const isSelected = config.selectedChapters.includes(chapterId);
    if (isSelected) {
      onChange({
        selectedChapters: config.selectedChapters.filter((id) => id !== chapterId),
      });
    } else {
      onChange({
        selectedChapters: [...config.selectedChapters, chapterId],
      });
    }
  };

  const selectAllChapters = () => {
    if (config.selectedChapters.length === chapters.length) {
      onChange({ selectedChapters: [] });
    } else {
      onChange({ selectedChapters: chapters.map((c) => c.id) });
    }
  };

  const allSelected = config.selectedChapters.length === chapters.length;

  return (
    <Card className="gap-6 px-5 sm:px-6">
      <div>
        <CardTitle>
          <h2>Board, class and chapters</h2>
        </CardTitle>
        <CardDescription className="mt-0.5">Questions are drawn from the chapters you choose.</CardDescription>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LabeledSelect label="Board" options={boardOptions} value={config.board} onValueChange={(board) => onChange({ board })} />
        <LabeledSelect label="Class" options={classOptions} value={config.className} onValueChange={(className) => onChange({ className })} />
        <LabeledSelect label="Subject" options={subjectOptions} value={config.subject} onValueChange={(subject) => onChange({ subject })} />
      </div>

      <fieldset className="space-y-3 border-t border-border pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <legend className="text-sm font-semibold">Chapters</legend>
            <p className="text-sm text-muted-foreground">
              {config.selectedChapters.length} of {chapters.length} selected
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={selectAllChapters}>
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {chapters.map((ch) => {
            const isSelected = config.selectedChapters.includes(ch.id);
            return (
              <label
                key={ch.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 ${
                  isSelected ? "border-primary bg-secondary/50" : "border-border bg-card hover:bg-muted/60"
                }`}
              >
                <Checkbox checked={isSelected} onCheckedChange={() => toggleChapter(ch.id)} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">
                    {ch.number}. {ch.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{ch.topicsCount} learning outcomes</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}
