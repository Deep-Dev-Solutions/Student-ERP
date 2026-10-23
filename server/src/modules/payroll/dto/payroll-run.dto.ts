import { IsString, Matches } from "class-validator";

export class StartPayrollDto {
  @IsString() branchId!: string;
  @IsString() @Matches(/^\d{4}-\d{2}$/, { message: "Choose a month" }) month!: string;
}
