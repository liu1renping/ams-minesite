import { AppShell } from "@/components/AppShell";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { Room } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  await connectDB();
  const rooms = await Room.find()
    .populate("campId", "name code")
    .sort({ block: 1, roomNumber: 1 })
    .lean();

  return (
    <AppShell pathname="/rooms">
      <Panel title="Room inventory">
        {rooms.length === 0 ? (
          <EmptyState message="No rooms found. Run npm run seed." />
        ) : (
          <DataTable
            headers={["Camp", "Block", "Room", "Type", "Beds", "Status", "Amenities"]}
          >
            {rooms.map((room) => {
              const camp = room.campId as { name?: string; code?: string } | null;
              return (
                <tr key={String(room._id)} className="text-stone-300">
                  <td className="px-2 py-3">
                    <div className="font-medium text-stone-100">{camp?.name}</div>
                    <div className="font-mono text-xs text-stone-500">{camp?.code}</div>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs">{room.block}</td>
                  <td className="px-2 py-3 font-mono text-xs">{room.roomNumber}</td>
                  <td className="px-2 py-3 capitalize">{room.type}</td>
                  <td className="px-2 py-3">{room.beds}</td>
                  <td className="px-2 py-3">
                    <StatusPill status={room.status} />
                  </td>
                  <td className="px-2 py-3 text-xs text-stone-400">
                    {(room.amenities ?? []).join(", ") || "—"}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
