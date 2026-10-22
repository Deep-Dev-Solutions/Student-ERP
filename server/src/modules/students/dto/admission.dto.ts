import { Type } from "class-transformer";
import { IsArray, IsEmail, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Max, Min, ValidateNested } from "class-validator";
import { GuardianDto } from "./guardian.dto";

export const GENDERS = ["male", "female", "other"] as const;

/** admitStudent and importStudents (one item of the batch). */
export class AdmissionDto {
  @IsISO8601({ strict: true }) admissionDate!: string;
  @IsString() @Length(1, 120) name!: string;
  @IsEmail({}, { message: "Enter a valid email address" }) email!: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() bForm?: string;
  @IsISO8601({ strict: true }) dateOfBirth!: string;
  @IsIn(GENDERS) gender!: (typeof GENDERS)[number];
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() religion?: string;
  @IsString() @Length(1, 240) address!: string;
  @IsOptional() @IsString() previousSchool?: string;
  @IsString() branchId!: string;
  @IsString() classId!: string;
  @IsString() sectionId!: string;
  @IsArray() @IsString({ each: true }) electiveSubjectIds!: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => GuardianDto) guardians!: GuardianDto[];
  @IsInt() @Min(0) monthlyFee!: number;
  @IsInt() @Min(0) @Max(100) discountPercent!: number;
  @IsOptional() @IsArray() @IsString({ each: true }) siblingIds?: string[];
}
