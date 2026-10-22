import { IsIn } from "class-validator";

export class UserStatusDto {
  @IsIn(["active", "disabled"]) status!: "active" | "disabled";
}
