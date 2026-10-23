import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { SalaryComponentDto } from "./salary-component.dto";

const STATUSES = ["active", "on_leave", "terminated"] as const;
const EMPLOYMENTS = ["permanent", "contract", "visiting"] as const;
const GENDERS = ["male", "female"] as const;

/** saveStaff: id present means update; absent means a new hire (the server assigns staffId). */
export class SaveStaffDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @Length(3, 120) name!: string;
  @IsString() email!: string;
  @IsString() phone!: string;
  @IsString() @Length(1, 80) role!: string;
  @IsString() @Length(1, 80) department!: string;
  @IsISO8601({ strict: true }) joinDate!: string;
  @IsIn(STATUSES) status!: (typeof STATUSES)[number];
  @IsString() branchId!: string;
  @IsIn(GENDERS) gender!: (typeof GENDERS)[number];
  @IsOptional() @IsString() cnic?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() qualification?: string;
  @IsIn(EMPLOYMENTS) employment!: (typeof EMPLOYMENTS)[number];
  @IsBoolean() teaches!: boolean;
  @IsInt() basicSalary!: number;
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SalaryComponentDto) allowances!: SalaryComponentDto[];
  @IsOptional() @IsString() bankAccount?: string;
}
