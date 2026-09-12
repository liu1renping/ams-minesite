import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Booking, Room } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("residentId", "firstName lastName employeeId company")
      .populate("roomId", "block roomNumber type")
      .populate("campId", "name code")
      .sort({ checkIn: -1 })
      .limit(100);

    return jsonOk(serialize(bookings));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch bookings", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    if (!(checkIn < checkOut)) {
      return jsonError("checkOut must be after checkIn");
    }

    const overlap = await Booking.findOne({
      roomId: body.roomId,
      status: { $in: ["reserved", "checked_in"] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    if (overlap) {
      return jsonError("Room already booked for overlapping dates", 409);
    }

    const booking = await Booking.create({
      ...body,
      checkIn,
      checkOut,
    });

    if (body.status === "checked_in") {
      await Room.findByIdAndUpdate(body.roomId, { status: "occupied" });
    }

    return jsonOk(serialize(booking), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create booking", 400);
  }
}
