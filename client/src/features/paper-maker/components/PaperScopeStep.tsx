"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Sparkles, Layers, CheckSquare } from "lucide-react";
import { ChapterItem, PaperScopeConfig } from "../types";

const mockChapters: ChapterItem[] = [
  { id: "ch-1", number: 1, title: "Physical Quantities & Measurement", topicsCount: 6 },
  { id: "ch-2", number: 2, title: "Kinematics & Motion Graphs", topicsCount: 8 },
  { id: "ch-3", number: 3, title: "Dynamics, Forces & Friction", topicsCount: 7 },
  { id: "ch-4", number: 4, title: "Turning Effect of Forces & Equilibrium", topicsCount: 5 },
  { id: "ch-5", number: 5, title: "Gravitation & Orbital Dynamics", topicsCount: 4 },
  { id: "ch-6", number: 6, title: "Work, Energy & Power Principles", topicsCount: 6 },
];

interface PaperScopeStepProps {
  config: PaperScopeConfig;
  onChange: (updated: Partial<PaperScopeConfig>) => void;
}

export function PaperScopeStep({ config, onChange }: PaperScopeStepProps) {
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
    if (config.selectedChapters.length === mockChapters.length) {
      onChange({ selectedChapters: [] });
    } else {
      onChange({ selectedChapters: mockChapters.map((c) => c.id) });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Step 1: Test Scope & Syllabus
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Select your target examination board, cohort grade, and curriculum units.
                </CardDescription>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3 w-3" /> AI Assisted
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Top Scope Selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Board */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Education Board / Curriculum
              </label>
              <Select
                value={config.board}
                onValueChange={(val) => {
                  if (val) onChange({ board: val });
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="fbise">Federal Board (FBISE)</SelectItem>
                  <SelectItem value="bise-lahore">Lahore Board (BISE)</SelectItem>
                  <SelectItem value="cambridge-igcse">Cambridge IGCSE / O-Level</SelectItem>
                  <SelectItem value="punjab-textbook">Punjab Curriculum (PCTB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Grade / Class
              </label>
              <Select
                value={config.className}
                onValueChange={(val) => {
                  if (val) onChange({ className: val });
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="class-8">Class 8 (Middle)</SelectItem>
                  <SelectItem value="class-9">Class 9 (Matric-I)</SelectItem>
                  <SelectItem value="class-10">Class 10 (Matric-II)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Subject
              </label>
              <Select
                value={config.subject}
                onValueChange={(val) => {
                  if (val) onChange({ subject: val });
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chapters Selection Checkbox List */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Select Syllabus Chapters
                </h4>
                <p className="text-xs text-slate-500">
                  Select unit chapters to pull questions from the repository.
                </p>
              </div>

              <button
                type="button"
                onClick={selectAllChapters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline active:scale-95 transition-all"
              >
                {config.selectedChapters.length === mockChapters.length
                  ? "Deselect All"
                  : "Select All Chapters"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {mockChapters.map((ch) => {
                const isSelected = config.selectedChapters.includes(ch.id);

                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChapter(ch.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleChapter(ch.id)}
                      className="mt-0.5 cursor-pointer data-checked:bg-blue-600 data-checked:border-blue-600"
                    />

                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        Chapter {ch.number}: {ch.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ch.topicsCount} mapped learning outcomes & SLOs
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

