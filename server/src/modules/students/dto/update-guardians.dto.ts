import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { GuardianDto } from "./guardian.dto";

/** updateGuardians: at least one guardian, exactly one marked primary (checked in the service). */
export class UpdateGuardiansDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => GuardianDto) guardians!: GuardianDto[];
}
