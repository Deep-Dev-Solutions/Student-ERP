import { IsArray, IsInt, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * A paper in progress is a wizard draft: board/class/book and the rest fill in
 * gradually, so (unlike every other save DTO) this one is deliberately loose.
 * paperProblem (server/src/domain/paper.ts) is what checks completeness, and
 * only at submit time — exactly like the mock.
 */
export class SaveDraftDto {
  @IsOptional() @IsString() id?: string;
  @IsString() teacherId!: string;
  @IsString() branchId!: string;
  @IsInt() @Min(1) @Max(6) step!: number;
  @IsString() boardId!: string;
  @IsString() classId!: string;
  @IsString() bookId!: string;
  @IsArray() @IsString({ each: true }) subTopicIds!: string[];
  @IsArray() blueprint!: unknown[];
  @IsArray() questions!: unknown[];
  @IsObject() details!: { examName: string; date: string; timeAllowed: string; instructions: string };
}
