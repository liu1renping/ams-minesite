import { connectDB } from "@/lib/db";
import { Booking, Camp, Resident, Room } from "@/lib/models";

export async function getDashboardStats() {
  await connectDB();

  const [camps, rooms, residents, activeBookings, roomStatus] = await Promise.all([
    Camp.countDocuments({ status: "active" }),
    Room.countDocuments(),
    Resident.countDocuments({ active: true }),
    Booking.countDocuments({ status: "checked_in" }),
    Room.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusMap = Object.fromEntries(roomStatus.map((s) => [s._id, s.count]));
  const available = statusMap.available ?? 0;
  const occupied = statusMap.occupied ?? 0;
  const maintenance = statusMap.maintenance ?? 0;

  return {
    camps,
    rooms,
    residents,
    activeBookings,
    available,
    occupied,
    maintenance,
    occupancyRate: rooms > 0 ? Math.round((occupied / rooms) * 100) : 0,
  };
}

export async function getRecentBookings(limit = 8) {
  await connectDB();
  return Booking.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("residentId", "firstName lastName employeeId company")
    .populate("roomId", "block roomNumber type")
    .populate("campId", "name code")
    .lean();
}

export async function getCampsWithOccupancy() {
  await connectDB();
  const camps = await Camp.find().sort({ name: 1 }).lean();
  const rooms = await Room.aggregate([
    {
      $group: {
        _id: "$campId",
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

  const byCamp = Object.fromEntries(rooms.map((r) => [String(r._id), r]));

  return camps.map((camp) => {
    const stats = byCamp[String(camp._id)] ?? { total: 0, occupied: 0, available: 0 };
    return {
      ...camp,
      roomStats: stats,
    };
  });
}

/** Rooms marked available and not tied to a reserved/checked-in booking. */
export async function getBookableRooms() {
  await connectDB();

  const blocked = await Booking.find({
    status: { $in: ["reserved", "checked_in"] },
  })
    .select("roomId")
    .lean();

  const blockedRoomIds = blocked.map((booking) => booking.roomId);

  const filter: Record<string, unknown> = { status: "available" };
  if (blockedRoomIds.length > 0) {
    filter._id = { $nin: blockedRoomIds };
  }

  return Room.find(filter)
    .select("block roomNumber campId")
    .sort({ block: 1, roomNumber: 1 })
    .lean();
}
