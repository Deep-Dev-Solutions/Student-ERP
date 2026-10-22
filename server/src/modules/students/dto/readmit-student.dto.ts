import { IsISO8601, IsString } from "class-validator";

export class ReadmitStudentDto {
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsISO8601({ strict: true }) date!: string;
}
