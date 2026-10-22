import { IsEmail, IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class CampusProfileDto {
  @IsString() @Length(2, 120) schoolName!: string;
  @IsString() tagline!: string;
  @IsString() registrationNumber!: string;
  @ValidateIf((o: CampusProfileDto) => o.contactEmail !== "") @IsEmail({}, { message: "Enter a valid contact email" }) contactEmail!: string;
  @IsString() contactPhone!: string;
  @IsString() website!: string;
  @IsString() streetAddress!: string;
  @IsString() city!: string;
  @IsString() province!: string;
  @IsString() postalCode!: string;
  @IsString() country!: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsString() principalName!: string;
}
