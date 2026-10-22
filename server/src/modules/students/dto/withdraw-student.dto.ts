import { IsIn, IsISO8601, IsOptional, IsString } from "class-validator";

export const WITHDRAW_REASONS = ["transferred", "relocated", "fees", "completed", "disciplinary", "other"] as const;

export class WithdrawStudentDto {
  @IsISO8601({ strict: true }) date!: string;
  @IsIn(WITHDRAW_REASONS) reason!: (typeof WITHDRAW_REASONS)[number];
  @IsOptional() @IsString() note?: string;
}
