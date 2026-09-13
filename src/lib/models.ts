import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  BEDROOM_STATUSES,
  BEDROOM_TYPES,
  BOOKING_STATUSES,
  DEPARTMENTS,
  HOUSE_STATUSES,
  RESIDENT_ROLES,
  ROSTER_PATTERNS,
  VISIT_REASONS,
} from "@/lib/types";

const HouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    suburb: { type: String, required: true, trim: true },
    status: { type: String, enum: HOUSE_STATUSES, default: "active" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

const BedroomSchema = new Schema(
  {
    houseId: { type: Schema.Types.ObjectId, ref: "House", required: true, index: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: BEDROOM_TYPES, required: true },
    beds: { type: Number, required: true, min: 1, default: 1 },
    status: { type: String, enum: BEDROOM_STATUSES, default: "available", index: true },
    amenities: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

BedroomSchema.index({ houseId: 1, label: 1 }, { unique: true });

const ResidentSchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, enum: RESIDENT_ROLES, required: true },
    roster: { type: String, enum: ROSTER_PATTERNS, default: "2/1" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const BookingSchema = new Schema(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
      index: true,
    },
    bedroomId: {
      type: Schema.Types.ObjectId,
      ref: "Bedroom",
      required: true,
      index: true,
    },
    houseId: { type: Schema.Types.ObjectId, ref: "House", required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "reserved", index: true },
    purpose: { type: String, default: "roster" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

BookingSchema.index({ bedroomId: 1, checkIn: 1, checkOut: 1 });

const TravellerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    company: { type: String, required: true, trim: true },
    photoIdFileName: { type: String, default: "" },
  },
  { _id: false },
);

const VisitorApplicationSchema = new Schema(
  {
    applicationType: { type: String, enum: APPLICATION_TYPES, required: true },
    travellers: {
      type: [TravellerSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "At least one traveller is required",
      },
    },
    hostName: { type: String, required: true, trim: true },
    hostTitle: { type: String, default: "", trim: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    reason: { type: String, enum: VISIT_REASONS, required: true },
    arrival: { type: Date, required: true },
    departure: { type: Date, required: true },
    accommodationRequired: { type: Boolean, required: true, default: true },
    carRego: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "submitted",
      index: true,
    },
    gmNotes: { type: String, default: "" },
    decidedAt: { type: Date },
    houseId: { type: Schema.Types.ObjectId, ref: "House" },
    bedroomId: { type: Schema.Types.ObjectId, ref: "Bedroom" },
    allocatedAt: { type: Date },
  },
  { timestamps: true },
);

export type HouseDocument = InferSchemaType<typeof HouseSchema> & {
  _id: Schema.Types.ObjectId;
};
export type BedroomDocument = InferSchemaType<typeof BedroomSchema> & {
  _id: Schema.Types.ObjectId;
};
export type ResidentDocument = InferSchemaType<typeof ResidentSchema> & {
  _id: Schema.Types.ObjectId;
};
export type BookingDocument = InferSchemaType<typeof BookingSchema> & {
  _id: Schema.Types.ObjectId;
};
export type VisitorApplicationDocument = InferSchemaType<typeof VisitorApplicationSchema> & {
  _id: Schema.Types.ObjectId;
};

export const House: Model<HouseDocument> =
  models.House || model<HouseDocument>("House", HouseSchema);

export const Bedroom: Model<BedroomDocument> =
  models.Bedroom || model<BedroomDocument>("Bedroom", BedroomSchema);

export const Resident: Model<ResidentDocument> =
  models.Resident || model<ResidentDocument>("Resident", ResidentSchema);

export const Booking: Model<BookingDocument> =
  models.Booking || model<BookingDocument>("Booking", BookingSchema);

export const VisitorApplication: Model<VisitorApplicationDocument> =
  models.VisitorApplication ||
  model<VisitorApplicationDocument>("VisitorApplication", VisitorApplicationSchema);
