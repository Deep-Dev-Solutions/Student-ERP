import { IsString, Length, Matches } from "class-validator";

export class AddBranchDto {
  @IsString() @Length(2, 80) name!: string;
  @IsString() @Matches(/^[A-Za-z0-9-]{2,10}$/, { message: "The campus code should be 2 to 10 letters or numbers" }) code!: string;
  @IsString() @Length(2, 120) location!: string;
}
