import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";

export class MarkEntryDto {
  @IsString() studentId!: string;
  @ValidateIf((o: MarkEntryDto) => o.obtained !== null) @IsNumber() obtained!: number | null;
  @IsBoolean() absent!: boolean;
  @IsOptional() @IsString() remark?: string;
}

/** saveMarks: entries for one paper (one exam + subject); entries not sent are left alone. */
export class SaveMarksDto {
  @IsString() examId!: string;
  @IsString() subjectId!: string;
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => MarkEntryDto) entries!: MarkEntryDto[];
}
