import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Bedroom, Booking, House } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_FIELDS = [
  "houseId",
  "label",
  "type",
  "beds",
  "status",
  "amenities",
] as const;

function pickBedroomFields(body: Record<string, unknown>) {
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
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid bedroom id", 400);

    const bedroom = await Bedroom.findById(id).populate("houseId", "name code address");
    if (!bedroom) return jsonError("Bedroom not found", 404);

    return jsonOk(serialize(bedroom));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch bedroom", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid bedroom id", 400);

    const body = await request.json();
    const update = pickBedroomFields(body);
    if (Object.keys(update).length === 0) return jsonError("No valid fields to update");

    if (update.houseId && !Types.ObjectId.isValid(String(update.houseId))) {
      return jsonError("Invalid houseId");
    }
    if (update.houseId) {
      const house = await House.findById(update.houseId);
      if (!house) return jsonError("House not found", 404);
    }
    if ("beds" in update) {
      const beds = Number(update.beds);
      if (Number.isNaN(beds) || beds < 1) return jsonError("beds must be at least 1");
      update.beds = beds;
    }

    const bedroom = await Bedroom.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate("houseId", "name code address");

    if (!bedroom) return jsonError("Bedroom not found", 404);
    return jsonOk(serialize(bedroom));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update bedroom", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid bedroom id", 400);

    const activeBooking = await Booking.exists({
      bedroomId: id,
      status: { $in: ["reserved", "checked_in"] },
    });
    if (activeBooking) {
      return jsonError(
        "Cannot delete bedroom with reserved or checked-in bookings. Cancel or check out first.",
        409,
      );
    }

    const bedroom = await Bedroom.findByIdAndDelete(id);
    if (!bedroom) return jsonError("Bedroom not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete bedroom", 400);
  }
}
