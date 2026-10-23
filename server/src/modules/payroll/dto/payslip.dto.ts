import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsString, Max, Min, ValidateNested } from "class-validator";
import { SalaryComponentDto } from "../../staff/dto/salary-component.dto";

export class UpdatePayslipDto {
  @IsInt() @Min(0) @Max(31) absentDays!: number;
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SalaryComponentDto) adjustments!: SalaryComponentDto[];
}

export class MarkPayslipsPaidDto {
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) ids!: string[];
  @IsIn(["bank", "cash", "cheque"]) method!: "bank" | "cash" | "cheque";
}
