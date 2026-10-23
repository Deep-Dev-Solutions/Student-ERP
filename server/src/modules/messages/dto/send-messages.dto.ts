import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsString, ValidateNested } from "class-validator";

const CHANNELS = ["whatsapp", "sms"] as const;

export class MessageRecipientDto {
  @IsString() name!: string;
  @IsString() phone!: string;
  @IsIn(CHANNELS) channel!: (typeof CHANNELS)[number];
  @IsString() text!: string;
}

/** sendMessages: the audience is already resolved and rendered client-side; this records the send. */
export class SendMessagesDto {
  @IsString() branchId!: string;
  @IsIn(CHANNELS) channel!: (typeof CHANNELS)[number];
  @IsString() audience!: string;
  @IsString() template!: string;
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => MessageRecipientDto) recipients!: MessageRecipientDto[];
}
