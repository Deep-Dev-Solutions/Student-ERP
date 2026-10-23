import { IsISO8601, IsInt, IsString, Min } from "class-validator";

export class AddAdvanceDto {
  @IsString() staffId!: string;
  @IsInt() @Min(1) amount!: number;
  @IsISO8601({ strict: true }) date!: string;
  @IsString() reason!: string;
  @IsInt() @Min(1) monthlyRecovery!: number;
}
