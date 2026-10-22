import { IsString } from "class-validator";

export class ActiveTenantDto {
  @IsString() tenantId!: string;
}
