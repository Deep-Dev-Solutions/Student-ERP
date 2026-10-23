import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsISO8601, IsInt, IsString, Max, Min, ValidateNested } from "class-validator";

export class DateSheetPaperDto {
  @IsString() subjectId!: string;
  @IsISO8601({ strict: true }) date!: string;
  @IsInt() @Min(1) @Max(1000) totalMarks!: number;
  @IsInt() @Min(0) passMarks!: number;
}

/** saveDateSheet: replaces one class's whole date sheet for an exam. */
export class SaveDateSheetDto {
  @IsString() classId!: string;
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => DateSheetPaperDto) papers!: DateSheetPaperDto[];
}
