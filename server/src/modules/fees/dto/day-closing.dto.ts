import { IsInt, IsObject, IsOptional, IsString, Min } from "class-validator";

export class CloseDayDto {
  @IsString() branchId!: string;
  @IsString() date!: string;
  /** Record<PaymentMethod, number>; checked in the service. */
  @IsObject() totals!: Record<string, number>;
  @IsInt() @Min(0) cashCounted!: number;
  @IsOptional() @IsString() note?: string;
}
