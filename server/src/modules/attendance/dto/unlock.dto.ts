import { IsBoolean, IsString } from "class-validator";

// Minimum-length wording matches the mock exactly; checked post-trim in the service, not here.
export class UnlockRegisterDto {
  @IsString() reason!: string;
}

export class RequestUnlockDto {
  @IsString() registerId!: string;
  @IsString() reason!: string;
}

export class DecideUnlockDto {
  @IsBoolean() approve!: boolean;
}
