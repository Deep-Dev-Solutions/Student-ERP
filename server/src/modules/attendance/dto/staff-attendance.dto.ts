import { IsObject, IsString } from "class-validator";

/** The date is the route param (PUT /api/staff-attendance/:date); only branchId and marks are in the body. */
export class SaveStaffAttendanceDto {
  @IsString() branchId!: string;
  /** Record<staffId, "present"|"absent"|"leave"|"late">; shape checked in the service. */
  @IsObject() marks!: Record<string, string>;
}
