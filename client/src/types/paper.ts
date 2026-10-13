export interface ChapterItem {
  id: string;
  number: number;
  title: string;
  topicsCount: number;
}

export interface PaperScopeConfig {
  board: string;
  className: string;
  subject: string;
  selectedChapters: string[];
}

export type QuestionType = "mcq" | "short" | "long";

export interface PaperQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  marks: number;
  options?: string[];
  chapter: string;
}

export interface PaperExportConfig {
  testDate: string;
  totalTime: string;
  totalMarks: number;
  institutionHeader: string;
  instructions: string;
}
