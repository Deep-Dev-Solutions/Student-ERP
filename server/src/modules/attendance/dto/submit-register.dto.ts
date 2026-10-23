import { IsISO8601, IsObject, IsOptional, IsString } from "class-validator";

export class SubmitRegisterDto {
  @IsString() branchId!: string;
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsISO8601({ strict: true }) date!: string;
  @IsOptional() @IsString() subjectId?: string;
  /** Record<studentId, { status: "present"|"absent"|"leave", remark?: string }>; shape checked in the service. */
  @IsObject() marks!: Record<string, { status: string; remark?: string }>;
}
