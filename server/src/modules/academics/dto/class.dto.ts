import { IsInt, IsOptional, IsString, Length } from "class-validator";

export class AddClassDto {
  @IsString() branchId!: string;
  @IsString() @Length(1, 60) name!: string;
  @IsInt() order!: number;
  @IsOptional() @IsString() @Length(0, 40) stage?: string;
}
