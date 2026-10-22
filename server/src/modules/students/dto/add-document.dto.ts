import { IsIn, IsInt, IsString, Length, Min } from "class-validator";

export const DOC_KINDS = ["b_form", "photo", "leaving_certificate", "result_card", "other"] as const;

/** addStudentDocument: metadata only for now; file bytes aren't stored until object storage is set up. */
export class AddDocumentDto {
  @IsString() @Length(1, 120) name!: string;
  @IsIn(DOC_KINDS) kind!: (typeof DOC_KINDS)[number];
  @IsString() @Length(1, 255) fileName!: string;
  @IsInt() @Min(0) sizeKb!: number;
}
