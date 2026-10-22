import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";

export const SCHOOL_ROLES = ["owner", "branch_admin", "accountant", "front_desk", "teacher"] as const;

export class InviteUserDto {
  @IsString() @Length(3, 80) name!: string;
  @IsEmail({}, { message: "Enter a valid email address" }) email!: string;
  @IsIn(SCHOOL_ROLES.filter((r) => r !== "owner"), { message: "Choose a role" }) role!: string;
  @IsOptional() @IsString() @Length(0, 80) title?: string;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) branchIds!: string[];
  @IsOptional() @IsString() staffId?: string;
}
