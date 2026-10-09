export type RoleKey = "admin" | "teacher" | "front_desk" | "accountant";

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  module: "academic" | "financial" | "attendance" | "administrative";
}

export interface RolePermissionsState {
  [permissionId: string]: {
    admin: boolean;
    teacher: boolean;
    front_desk: boolean;
    accountant: boolean;
  };
}

export interface CampusProfileData {
  schoolName: string;
  tagline: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  logoUrl?: string;
  principalName: string;
}

