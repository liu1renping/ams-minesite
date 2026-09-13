import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Bedroom, Booking } from "@/lib/models";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return jsonError("Invalid booking id", 400);
    }

    const body = await request.json();
    const booking = await Booking.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (body.status === "checked_in") {
      await Bedroom.findByIdAndUpdate(booking.bedroomId, { status: "occupied" });
    }

    if (body.status === "checked_out" || body.status === "cancelled") {
      const stillOccupied = await Booking.exists({
        bedroomId: booking.bedroomId,
        status: "checked_in",
        _id: { $ne: booking._id },
      });
      if (!stillOccupied) {
        await Bedroom.findByIdAndUpdate(booking.bedroomId, { status: "available" });
      }
    }

    return jsonOk(serialize(booking));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update booking", 400);
  }
}
