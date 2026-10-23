import { IsBoolean } from "class-validator";

export class SetResultsPublishedDto {
  @IsBoolean() published!: boolean;
}
