import { IsObject, IsString } from "class-validator";

export class FeePlanDto {
  @IsString() id!: string;
  @IsString() branchId!: string;
  @IsString() classId!: string;
  /** Record<feeHeadId, amount>; checked in the service. */
  @IsObject() amounts!: Record<string, number>;
}
