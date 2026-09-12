import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import {
  BOOKING_STATUSES,
  RESIDENT_ROLES,
  ROOM_STATUSES,
  ROOM_TYPES,
  ROSTER_PATTERNS,
} from "@/lib/types";

const CampSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    siteName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "commissioning"],
      default: "active",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

const RoomSchema = new Schema(
  {
    campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true, index: true },
    block: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    type: { type: String, enum: ROOM_TYPES, required: true },
    beds: { type: Number, required: true, min: 1, default: 1 },
    status: { type: String, enum: ROOM_STATUSES, default: "available", index: true },
    amenities: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

RoomSchema.index({ campId: 1, block: 1, roomNumber: 1 }, { unique: true });

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
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "reserved", index: true },
    purpose: { type: String, default: "roster" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

BookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });

export type CampDocument = InferSchemaType<typeof CampSchema> & { _id: Schema.Types.ObjectId };
export type RoomDocument = InferSchemaType<typeof RoomSchema> & { _id: Schema.Types.ObjectId };
export type ResidentDocument = InferSchemaType<typeof ResidentSchema> & {
  _id: Schema.Types.ObjectId;
};
export type BookingDocument = InferSchemaType<typeof BookingSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Camp: Model<CampDocument> =
  models.Camp || model<CampDocument>("Camp", CampSchema);

export const Room: Model<RoomDocument> =
  models.Room || model<RoomDocument>("Room", RoomSchema);

export const Resident: Model<ResidentDocument> =
  models.Resident || model<ResidentDocument>("Resident", ResidentSchema);

export const Booking: Model<BookingDocument> =
  models.Booking || model<BookingDocument>("Booking", BookingSchema);
