import { IsString } from "class-validator";

export class SaveTemplateDto {
  @IsString() name!: string;
  @IsString() body!: string;
}
