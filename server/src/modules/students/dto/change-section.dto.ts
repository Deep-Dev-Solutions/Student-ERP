import { ArrayMinSize, IsArray, IsString } from "class-validator";

/** Moves one or more students to another section (and class) at the same campus. */
export class ChangeSectionDto {
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) ids!: string[];
  @IsString() classId!: string;
  @IsString() sectionId!: string;
}
