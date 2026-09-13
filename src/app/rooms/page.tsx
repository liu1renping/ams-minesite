import { AppShell } from "@/components/AppShell";
import {
  RoomsManager,
  type CampOption,
  type RoomRecord,
} from "@/components/RoomsManager";
import { connectDB } from "@/lib/db";
import { Camp, Room } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  await connectDB();

  const [roomDocs, campDocs] = await Promise.all([
    Room.find().populate("campId", "name code").sort({ block: 1, roomNumber: 1 }).lean(),
    Camp.find().select("name code").sort({ name: 1 }).lean(),
  ]);

  const camps: CampOption[] = campDocs.map((camp) => ({
    _id: String(camp._id),
    name: camp.name,
    code: camp.code,
  }));

  const rooms: RoomRecord[] = roomDocs.map((room) => {
    const camp = room.campId as { _id?: unknown; name?: string; code?: string } | null;
    return {
      _id: String(room._id),
      campId: camp?._id ? String(camp._id) : String(room.campId),
      campName: camp?.name ?? "Unknown",
      campCode: camp?.code ?? "—",
      block: room.block,
      roomNumber: room.roomNumber,
      type: room.type,
      beds: room.beds,
      status: room.status,
      amenities: room.amenities ?? [],
    };
  });

  return (
    <AppShell pathname="/rooms">
      <RoomsManager rooms={rooms} camps={camps} />
    </AppShell>
  );
}
