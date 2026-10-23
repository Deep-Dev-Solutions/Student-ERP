import { IsArray, IsISO8601, IsString, Matches } from "class-validator";

export class GenerateVouchersDto {
  @IsString() @Matches(/^\d{4}-\d{2}$/, { message: "Choose a month" }) month!: string;
  @IsISO8601({ strict: true }) dueDate!: string;
  @IsArray() @IsString({ each: true }) studentIds!: string[];
}

export class CancelVoucherDto {
  @IsString() reason!: string;
}
