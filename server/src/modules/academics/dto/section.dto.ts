import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class AddSectionDto {
  @IsString() classId!: string;
  @IsString() @Length(1, 20) name!: string;
  @IsIn(["morning", "evening"]) shift!: "morning" | "evening";
  @IsInt() @Min(1) @Max(200) capacity!: number;
  @IsOptional() @IsString() inchargeId?: string;
}

export class UpdateSectionDto {
  @IsOptional() @IsString() @Length(1, 20) name?: string;
  @IsOptional() @IsIn(["morning", "evening"]) shift?: "morning" | "evening";
  @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
  @IsOptional() @IsString() inchargeId?: string;
}
