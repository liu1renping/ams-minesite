import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { normalizeBedroomInput, type BedroomInput } from "@/lib/bedroom-input";
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

async function syncBedrooms(houseId: string, rawBedrooms: unknown[]) {
  const bedrooms = rawBedrooms
    .map((item) => normalizeBedroomInput(item))
    .filter((item): item is BedroomInput => item !== null);

  if (bedrooms.length === 0) {
    throw new Error("At least one bedroom is required");
  }

  const existing = await Bedroom.find({ houseId });
  const incomingIds = new Set(
    bedrooms.filter((b) => b._id).map((b) => String(b._id)),
  );

  for (const bedroom of existing) {
    if (incomingIds.has(String(bedroom._id))) continue;

    const activeBooking = await Booking.exists({
      bedroomId: String(bedroom._id),
      status: { $in: ["reserved", "checked_in"] },
    } as Record<string, unknown>);
    if (activeBooking) {
      throw new Error(
        `Cannot remove bedroom "${bedroom.label}" with reserved or checked-in bookings`,
      );
    }

    await Bedroom.findByIdAndDelete(bedroom._id);
  }

  for (const bedroom of bedrooms) {
    if (bedroom._id) {
      if (!Types.ObjectId.isValid(bedroom._id)) {
        throw new Error(`Invalid bedroom id: ${bedroom._id}`);
      }

      const updated = await Bedroom.findOneAndUpdate(
        { _id: bedroom._id, houseId } as Record<string, unknown>,
        {
          label: bedroom.label,
          type: bedroom.type,
          beds: bedroom.beds,
          status: bedroom.status,
          amenities: bedroom.amenities,
        } as Record<string, unknown>,
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new Error(`Bedroom not found: ${bedroom.label}`);
      }
      continue;
    }

    await Bedroom.create({
      houseId,
      label: bedroom.label,
      type: bedroom.type,
      beds: bedroom.beds,
      status: bedroom.status,
      amenities: bedroom.amenities,
    } as Record<string, unknown>);
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid house id", 400);

    const house = await House.findById(id);
    if (!house) return jsonError("House not found", 404);

    const bedrooms = await Bedroom.find({ houseId: id }).sort({ label: 1 });

    return jsonOk(serialize({ ...house.toObject(), bedrooms }));
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

    if (Object.keys(update).length > 0) {
      const house = await House.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });
      if (!house) return jsonError("House not found", 404);
    } else if (!(Array.isArray(body.bedrooms) && body.bedrooms.length > 0)) {
      return jsonError("No valid fields to update");
    }

    if (Array.isArray(body.bedrooms)) {
      await syncBedrooms(id, body.bedrooms);
    }

    const house = await House.findById(id);
    if (!house) return jsonError("House not found", 404);

    const bedrooms = await Bedroom.find({ houseId: id }).sort({ label: 1 });
    return jsonOk(serialize({ ...house.toObject(), bedrooms }));
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

    const activeBooking = await Booking.exists({
      houseId: id,
      status: { $in: ["reserved", "checked_in"] },
    } as Record<string, unknown>);
    if (activeBooking) {
      return jsonError("Cannot delete house with reserved or checked-in bookings.", 409);
    }

    const bedrooms = await Bedroom.find({ houseId: id }).select("_id label");
    for (const bedroom of bedrooms) {
      const bedroomBooking = await Booking.exists({
        bedroomId: String(bedroom._id),
        status: { $in: ["reserved", "checked_in"] },
      } as Record<string, unknown>);
      if (bedroomBooking) {
        return jsonError(
          `Cannot delete house — bedroom "${bedroom.label}" has active bookings.`,
          409,
        );
      }
    }

    await Bedroom.deleteMany({ houseId: id });

    const house = await House.findByIdAndDelete(id);
    if (!house) return jsonError("House not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete house", 400);
  }
}
