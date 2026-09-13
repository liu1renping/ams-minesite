import { connectDB } from "@/lib/db";
import { Booking, Bedroom, House, Resident } from "@/lib/models";

export async function getDashboardStats() {
  await connectDB();

  const [houses, bedrooms, residents, activeBookings, bedroomStatus] = await Promise.all([
    House.countDocuments({ status: "active" }),
    Bedroom.countDocuments(),
    Resident.countDocuments({ active: true }),
    Booking.countDocuments({ status: "checked_in" }),
    Bedroom.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusMap = Object.fromEntries(bedroomStatus.map((s) => [s._id, s.count]));
  const available = statusMap.available ?? 0;
  const occupied = statusMap.occupied ?? 0;
  const maintenance = statusMap.maintenance ?? 0;

  return {
    houses,
    bedrooms,
    residents,
    activeBookings,
    available,
    occupied,
    maintenance,
    occupancyRate: bedrooms > 0 ? Math.round((occupied / bedrooms) * 100) : 0,
  };
}

export async function getRecentBookings(limit = 8) {
  await connectDB();
  return Booking.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("residentId", "firstName lastName employeeId company")
    .populate("bedroomId", "label type")
    .populate("houseId", "name code")
    .lean();
}

export async function getHousesWithOccupancy() {
  await connectDB();
  const houses = await House.find().sort({ name: 1 }).lean();
  const bedrooms = await Bedroom.aggregate([
    {
      $group: {
        _id: "$houseId",
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
        },
        available: {
          $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
        },
      },
    },
  ]);

  const byHouse = Object.fromEntries(bedrooms.map((r) => [String(r._id), r]));

  return houses.map((house) => {
    const stats = byHouse[String(house._id)] ?? { total: 0, occupied: 0, available: 0 };
    return {
      ...house,
      bedroomStats: stats,
    };
  });
}

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
