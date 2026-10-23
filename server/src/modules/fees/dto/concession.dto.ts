import { IsNumber, IsString, Length, Max, Min } from "class-validator";

export class ConcessionDto {
  @IsString() id!: string;
  @IsString() @Length(1, 80) name!: string;
  @IsNumber() @Min(1) @Max(100) percent!: number;
}
