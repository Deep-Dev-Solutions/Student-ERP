import { IsArray, IsString } from "class-validator";

export class SetElectivesDto {
  @IsArray() @IsString({ each: true }) subjectIds!: string[];
}
