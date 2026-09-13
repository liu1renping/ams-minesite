export const BEDROOM_TYPES = ["single", "double", "twin", "ensuite"] as const;
export type BedroomType = (typeof BEDROOM_TYPES)[number];

export const BEDROOM_STATUSES = [
  "available",
  "occupied",
  "maintenance",
  "out_of_service",
] as const;
export type BedroomStatus = (typeof BEDROOM_STATUSES)[number];

export const HOUSE_STATUSES = ["active", "inactive"] as const;
export type HouseStatus = (typeof HOUSE_STATUSES)[number];

export const RESIDENT_ROLES = [
  "operator",
  "supervisor",
  "contractor",
  "visitor",
  "management",
] as const;
export type ResidentRole = (typeof RESIDENT_ROLES)[number];

export const BOOKING_STATUSES = [
  "reserved",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ROSTER_PATTERNS = ["2/1", "8/6", "14/7", "permanent", "adhoc"] as const;
export type RosterPattern = (typeof ROSTER_PATTERNS)[number];

export const APPLICATION_TYPES = ["single", "group"] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

export const DEPARTMENTS = [
  "HSE",
  "Operation",
  "Processing",
  "Maintenance",
  "Finance",
  "HR",
  "IT",
] as const;

export const VISIT_REASONS = [
  "Site Tour",
  "Business Meeting",
  "Project",
  "Inspection",
  "Other",
] as const;

export const APPLICATION_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "allocated",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
