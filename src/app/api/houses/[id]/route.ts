import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Bedroom, Booking, House } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_FIELDS = ["name", "code", "address", "suburb", "status", "notes"] as const;

function pickHouseFields(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;
    if (key === "code" && typeof body[key] === "string") {
      update[key] = body[key].trim().toUpperCase();
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
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid house id", 400);

    const house = await House.findById(id);
    if (!house) return jsonError("House not found", 404);

    return jsonOk(serialize(house));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch house", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid house id", 400);

    const body = await request.json();
    const update = pickHouseFields(body);
    if (Object.keys(update).length === 0) return jsonError("No valid fields to update");

    const house = await House.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!house) return jsonError("House not found", 404);

    return jsonOk(serialize(house));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update house", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid house id", 400);

    const bedroomCount = await Bedroom.countDocuments({ houseId: id });
    if (bedroomCount > 0) {
      return jsonError(
        `Cannot delete house with ${bedroomCount} bedroom(s). Remove bedrooms first.`,
        409,
      );
    }

    const activeBooking = await Booking.exists({
      houseId: id,
      status: { $in: ["reserved", "checked_in"] },
    });
    if (activeBooking) {
      return jsonError("Cannot delete house with reserved or checked-in bookings.", 409);
    }

    const house = await House.findByIdAndDelete(id);
    if (!house) return jsonError("House not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete house", 400);
  }
}
