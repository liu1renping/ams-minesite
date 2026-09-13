import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Booking, Camp, Room } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_FIELDS = [
  "name",
  "code",
  "siteName",
  "location",
  "capacity",
  "status",
  "notes",
] as const;

function pickCampFields(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      if (key === "code" && typeof body[key] === "string") {
        update[key] = body[key].trim().toUpperCase();
      } else if (key === "capacity") {
        update[key] = Number(body[key]);
      } else if (typeof body[key] === "string") {
        update[key] = body[key].trim();
      } else {
        update[key] = body[key];
      }
    }
  }
  return update;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid camp id", 400);

    const camp = await Camp.findById(id);
    if (!camp) return jsonError("Camp not found", 404);

    return jsonOk(serialize(camp));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch camp", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid camp id", 400);

    const body = await request.json();
    const update = pickCampFields(body);

    if (Object.keys(update).length === 0) {
      return jsonError("No valid fields to update");
    }

    const camp = await Camp.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!camp) return jsonError("Camp not found", 404);

    return jsonOk(serialize(camp));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update camp", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid camp id", 400);

    const roomCount = await Room.countDocuments({ campId: id });
    if (roomCount > 0) {
      return jsonError(
        `Cannot delete camp with ${roomCount} room(s). Remove or reassign rooms first.`,
        409,
      );
    }

    const activeBooking = await Booking.exists({
      campId: id,
      status: { $in: ["reserved", "checked_in"] },
    });

    if (activeBooking) {
      return jsonError(
        "Cannot delete camp with reserved or checked-in bookings.",
        409,
      );
    }

    const camp = await Camp.findByIdAndDelete(id);
    if (!camp) return jsonError("Camp not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete camp", 400);
  }
}
