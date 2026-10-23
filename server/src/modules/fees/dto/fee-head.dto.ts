import { IsArray, IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";

export class FeeHeadDto {
  @IsString() id!: string;
  @IsString() @Length(1, 80) name!: string;
  @IsIn(["monthly", "term", "one_time"]) frequency!: "monthly" | "term" | "one_time";
  @IsOptional() @IsArray() @IsString({ each: true }) termMonths?: string[];
  @IsBoolean() discountable!: boolean;
}
