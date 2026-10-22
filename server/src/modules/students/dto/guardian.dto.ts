import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";

export const RELATIONS = ["father", "mother", "guardian", "grandparent", "sibling"] as const;

/** Shared by admission, import and updateGuardians. */
export class GuardianDto {
  /** Present when editing an existing guardian; ignored on admission. */
  @IsOptional() @IsString() id?: string;
  @IsString() @Length(1, 80) name!: string;
  @IsIn(RELATIONS) relation!: (typeof RELATIONS)[number];
  @IsOptional() @IsString() cnic?: string;
  @IsString() @Length(1, 20) phone!: string;
  @IsBoolean() whatsapp!: boolean;
  @IsBoolean() primary!: boolean;
  @IsOptional() @IsString() occupation?: string;
}
