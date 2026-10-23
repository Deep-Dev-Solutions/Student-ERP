import { IsInt, IsString, Length } from "class-validator";

export class SalaryComponentDto {
  @IsString() @Length(1, 60) label!: string;
  @IsInt() amount!: number;
}
