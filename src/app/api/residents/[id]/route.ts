import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Booking, Resident } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_FIELDS = [
  "employeeId",
  "firstName",
  "lastName",
  "company",
  "role",
  "roster",
  "phone",
  "email",
  "emergencyContact",
  "active",
] as const;

function pickResidentFields(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key];
  }
  return update;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid resident id", 400);

    const resident = await Resident.findById(id);
    if (!resident) return jsonError("Resident not found", 404);

    return jsonOk(serialize(resident));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch resident", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid resident id", 400);

    const body = await request.json();
    const update = pickResidentFields(body);

    if (Object.keys(update).length === 0) {
      return jsonError("No valid fields to update");
    }

    const resident = await Resident.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!resident) return jsonError("Resident not found", 404);

    return jsonOk(serialize(resident));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update resident", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid resident id", 400);

    const activeStay = await Booking.exists({
      residentId: id,
      status: { $in: ["reserved", "checked_in"] },
    });

    if (activeStay) {
      return jsonError(
        "Cannot delete resident with reserved or checked-in bookings. Cancel or check out first.",
        409,
      );
    }

    const resident = await Resident.findByIdAndDelete(id);
    if (!resident) return jsonError("Resident not found", 404);

    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete resident", 400);
  }
}
