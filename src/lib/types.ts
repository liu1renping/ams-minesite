export const ROOM_TYPES = ["single", "twin", "ensuite", "accessible"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_STATUSES = [
  "available",
  "occupied",
  "maintenance",
  "out_of_service",
] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const CAMP_STATUSES = ["active", "inactive", "commissioning"] as const;
export type CampStatus = (typeof CAMP_STATUSES)[number];

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
  "Operations",
  "Maintenance",
  "HSE",
  "Engineering",
  "HR",
  "Finance",
  "Other",
] as const;

export const VISIT_REASONS = [
  "Site Tour",
  "Meeting",
  "Audit",
  "Training",
  "Contractor Work",
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
