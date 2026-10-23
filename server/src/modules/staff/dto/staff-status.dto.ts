import { IsIn, IsISO8601, IsOptional, IsString } from "class-validator";

export class StaffStatusDto {
  @IsIn(["active", "on_leave", "terminated"]) status!: "active" | "on_leave" | "terminated";
  @IsOptional() @IsISO8601({ strict: true }) date?: string;
  @IsOptional() @IsString() reason?: string;
}
