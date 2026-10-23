import { IsString } from "class-validator";

export class ReturnPaperDto {
  @IsString() note!: string;
}
