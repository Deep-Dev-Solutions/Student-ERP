import { IsInt, IsString, Max, Min, ValidateIf } from "class-validator";

export class SetAllocationDto {
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsString() subjectId!: string;
  /** A staff number, or null to clear the allocation. */
  @ValidateIf((o: SetAllocationDto) => o.teacherId !== null) @IsString() teacherId!: string | null;
  @ValidateIf((o: SetAllocationDto) => o.weeklyPeriods !== undefined) @IsInt() @Min(1) @Max(12) weeklyPeriods?: number;
}
