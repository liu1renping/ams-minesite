import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Camp, Room } from "@/lib/models";
import { Types } from "mongoose";

function parseAmenities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (campId) filter.campId = campId;
    if (status) filter.status = status;

    const rooms = await Room.find(filter)
      .populate("campId", "name code")
      .sort({ block: 1, roomNumber: 1 });

    return jsonOk(serialize(rooms));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch rooms", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const required = ["campId", "block", "roomNumber", "type"] as const;
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return jsonError(`${field} is required`);
      }
    }

    if (!Types.ObjectId.isValid(String(body.campId))) {
      return jsonError("Invalid campId");
    }

    const camp = await Camp.findById(body.campId);
    if (!camp) return jsonError("Camp not found", 404);

    const beds = body.beds === undefined ? 1 : Number(body.beds);
    if (Number.isNaN(beds) || beds < 1) {
      return jsonError("beds must be at least 1");
    }

    const room = await Room.create({
      campId: body.campId,
      block: String(body.block).trim(),
      roomNumber: String(body.roomNumber).trim(),
      type: body.type,
      beds,
      status: body.status ?? "available",
      amenities: parseAmenities(body.amenities),
    });

    const populated = await Room.findById(room._id).populate("campId", "name code");
    return jsonOk(serialize(populated), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create room", 400);
  }
}
