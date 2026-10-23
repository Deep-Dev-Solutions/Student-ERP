import { ArrayMinSize, IsArray, IsIn, IsISO8601, IsOptional, IsString, Length } from "class-validator";

const TERM_TYPES = ["midterm", "final", "monthly", "quiz"] as const;

/** saveExam: id present means update; absent means a new exam. */
export class SaveExamDto {
  @IsOptional() @IsString() id?: string;
  @IsString() branchId!: string;
  @IsString() sessionId!: string;
  @IsString() @Length(3, 120) title!: string;
  @IsIn(TERM_TYPES) termType!: (typeof TERM_TYPES)[number];
  @IsISO8601({ strict: true }) startDate!: string;
  @IsISO8601({ strict: true }) endDate!: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) classIds!: string[];
}
