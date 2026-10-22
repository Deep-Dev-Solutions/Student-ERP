import { IsString } from "class-validator";

/** transferStudent: to another campus. */
export class TransferStudentDto {
  @IsString() branchId!: string;
  @IsString() classId!: string;
  @IsString() sectionId!: string;
}
