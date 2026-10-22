import { IsString, Length } from "class-validator";

export class AddSubjectDto {
  @IsString() @Length(1, 80) name!: string;
  @IsString() @Length(1, 20) code!: string;
}
