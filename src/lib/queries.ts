import { connectDB } from "@/lib/db";
import { Booking, Bedroom } from "@/lib/models";

/** Bedrooms marked available and not tied to a reserved/checked-in booking. */
export async function getBookableBedrooms() {
  await connectDB();

  const blocked = await Booking.find({
    status: { $in: ["reserved", "checked_in"] },
  })
    .select("bedroomId")
    .lean();

  const blockedBedroomIds = blocked.map((booking) => booking.bedroomId);

  const filter: Record<string, unknown> = { status: "available" };
  if (blockedBedroomIds.length > 0) {
    filter._id = { $nin: blockedBedroomIds };
  }

  return Bedroom.find(filter)
    .select("label type beds houseId")
    .sort({ label: 1 })
    .lean();
}
