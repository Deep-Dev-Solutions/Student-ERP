import { IsArray, IsEmail, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { GENDERS } from "./admission.dto";

/** updateStudent: profile fields. Guardians, documents, enrollment and fee standing go through their own endpoints. */
export class UpdateStudentDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsEmail({}, { message: "Enter a valid email address" }) email?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() bForm?: string;
  @IsOptional() @IsISO8601({ strict: true }) dateOfBirth?: string;
  @IsOptional() @IsIn(GENDERS) gender?: (typeof GENDERS)[number];
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() @Length(1, 240) address?: string;
  @IsOptional() @IsString() previousSchool?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) electiveSubjectIds?: string[];
  @IsOptional() @IsInt() @Min(0) monthlyFee?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;
}
