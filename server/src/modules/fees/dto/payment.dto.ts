import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class RecordPaymentDto {
  @IsString() voucherId!: string;
  @IsIn(["cash", "bank", "cheque", "easypaisa"]) method!: "cash" | "bank" | "cheque" | "easypaisa";
  @IsInt() amount!: number;
  @IsInt() @Min(0) lateFine!: number;
  /** A retried request with the same key returns the original payment instead of recording it twice. */
  @IsOptional() @IsString() idempotencyKey?: string;
}

export class ReversePaymentDto {
  @IsString() reason!: string;
}
