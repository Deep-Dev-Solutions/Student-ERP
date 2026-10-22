import { IsISO8601, IsString, Matches } from "class-validator";

export class AddSessionDto {
  @IsString() @Matches(/^\d{4}-\d{4}$/, { message: "The session should look like 2026-2027" }) label!: string;
  @IsISO8601({ strict: true }) startDate!: string;
  @IsISO8601({ strict: true }) endDate!: string;
}

export class CurrentSessionDto {
  @IsString() sessionId!: string;
}
