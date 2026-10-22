import { IsBoolean, IsString } from "class-validator";

/** Offers a subject in a class (as core or elective), or stops offering it. */
export class SetClassSubjectDto {
  @IsString() classId!: string;
  @IsString() subjectId!: string;
  @IsBoolean() offered!: boolean;
  @IsBoolean() elective!: boolean;
}
