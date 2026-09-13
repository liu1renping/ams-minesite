import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Booking, Camp, Room } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_FIELDS = [
  "campId",
  "block",
  "roomNumber",
  "type",
  "beds",
  "status",
  "amenities",
] as const;

function pickRoomFields(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;

    if (key === "beds") {
      update[key] = Number(body[key]);
    } else if (key === "amenities") {
      if (Array.isArray(body[key])) {
        update[key] = (body[key] as unknown[])
          .map((item) => String(item).trim())
          .filter(Boolean);
      } else if (typeof body[key] === "string") {
        update[key] = body[key]
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } else if (typeof body[key] === "string") {
      update[key] = body[key].trim();
    } else {
      update[key] = body[key];
    }
  }
  return update;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid room id", 400);

    const room = await Room.findById(id).populate("campId", "name code");
    if (!room) return jsonError("Room not found", 404);

    return jsonOk(serialize(room));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch room", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid room id", 400);

    const body = await request.json();
    const update = pickRoomFields(body);

    if (Object.keys(update).length === 0) {
      return jsonError("No valid fields to update");
    }

    if (update.campId && !Types.ObjectId.isValid(String(update.campId))) {
      return jsonError("Invalid campId");
    }

    if (update.campId) {
      const camp = await Camp.findById(update.campId);
      if (!camp) return jsonError("Camp not found", 404);
    }

    if ("beds" in update) {
      const beds = Number(update.beds);
      if (Number.isNaN(beds) || beds < 1) {
        return jsonError("beds must be at least 1");
      }
      update.beds = beds;
    }

    const room = await Room.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate("campId", "name code");

    if (!room) return jsonError("Room not found", 404);

    return jsonOk(serialize(room));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update room", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid room id", 400);

    const activeBooking = await Booking.exists({
      roomId: id,
      status: { $in: ["reserved", "checked_in"] },
    });

    if (activeBooking) {
      return jsonError(
        "Cannot delete room with reserved or checked-in bookings. Cancel or check out first.",
        409,
      );
    }

    const room = await Room.findByIdAndDelete(id);
    if (!room) return jsonError("Room not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete room", 400);
  }
}
