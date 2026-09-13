import { AppShell } from "@/components/AppShell";
import { QuickBookingForm } from "@/components/QuickBookingForm";
import { DataTable, EmptyState, Panel, StatCard, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { Camp, Resident, Room } from "@/lib/models";
import { getCampsWithOccupancy, getDashboardStats, getRecentBookings } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage() {
  let stats = {
    camps: 0,
    rooms: 0,
    residents: 0,
    activeBookings: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    occupancyRate: 0,
  };
  let camps: Awaited<ReturnType<typeof getCampsWithOccupancy>> = [];
  let bookings: Awaited<ReturnType<typeof getRecentBookings>> = [];
  let formCamps: Array<{ _id: string; name: string }> = [];
  let formRooms: Array<{
    _id: string;
    block: string;
    roomNumber: string;
    campId: string | { _id: string };
  }> = [];
  let formResidents: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  }> = [];
  let dbError: string | null = null;

  try {
    await connectDB();
    const [nextStats, nextCamps, nextBookings, campDocs, roomDocs, residentDocs] =
      await Promise.all([
        getDashboardStats(),
        getCampsWithOccupancy(),
        getRecentBookings(),
        Camp.find().select("name").sort({ name: 1 }).lean(),
        Room.find({ status: "available" })
          .select("block roomNumber campId")
          .sort({ block: 1, roomNumber: 1 })
          .lean(),
        Resident.find({ active: true })
          .select("firstName lastName employeeId")
          .sort({ lastName: 1 })
          .lean(),
      ]);

    stats = nextStats;
    camps = nextCamps;
    bookings = nextBookings;
    formCamps = campDocs.map((c) => ({ _id: String(c._id), name: c.name }));
    formRooms = roomDocs.map((r) => ({
      _id: String(r._id),
      block: r.block,
      roomNumber: r.roomNumber,
      campId: String(r.campId),
    }));
    formResidents = residentDocs.map((r) => ({
      _id: String(r._id),
      firstName: r.firstName,
      lastName: r.lastName,
      employeeId: r.employeeId,
    }));
  } catch (error) {
    console.error(error);
    dbError =
      "Cannot reach MongoDB. Start a local MongoDB instance or set MONGODB_URI in .env.local, then run npm run seed.";
  }

  return (
    <AppShell pathname="/">
      {dbError ? (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {dbError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active camps" value={stats.camps} />
        <StatCard
          label="Occupancy"
          value={`${stats.occupancyRate}%`}
          hint={`${stats.occupied} occupied · ${stats.available} available`}
        />
        <StatCard label="Active residents" value={stats.residents} />
        <StatCard
          label="Checked in"
          value={stats.activeBookings}
          hint={`${stats.maintenance} rooms in maintenance`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Camp occupancy">
            {camps.length === 0 ? (
              <EmptyState message="No camps yet. Run npm run seed to load sample minesite data." />
            ) : (
              <DataTable headers={["Camp", "Code", "Rooms", "Occupied", "Available", "Status"]}>
                {camps.map((camp) => (
                  <tr key={String(camp._id)} className="text-stone-300">
                    <td className="px-2 py-3 font-medium text-stone-100">{camp.name}</td>
                    <td className="px-2 py-3 font-mono text-xs">{camp.code}</td>
                    <td className="px-2 py-3">{camp.roomStats.total}</td>
                    <td className="px-2 py-3">{camp.roomStats.occupied}</td>
                    <td className="px-2 py-3">{camp.roomStats.available}</td>
                    <td className="px-2 py-3">
                      <StatusPill status={camp.status} />
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Quick booking">
            <QuickBookingForm
              camps={formCamps}
              rooms={formRooms}
              residents={formResidents}
            />
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Recent bookings">
          {bookings.length === 0 ? (
            <EmptyState message="No bookings yet." />
          ) : (
            <DataTable
              headers={["Resident", "Camp / Room", "Stay", "Status"]}
            >
              {bookings.map((booking) => {
                const resident = booking.residentId as {
                  firstName?: string;
                  lastName?: string;
                  employeeId?: string;
                } | null;
                const room = booking.roomId as {
                  block?: string;
                  roomNumber?: string;
                } | null;
                const camp = booking.campId as { name?: string; code?: string } | null;

                return (
                  <tr key={String(booking._id)} className="text-stone-300">
                    <td className="px-2 py-3">
                      <div className="font-medium text-stone-100">
                        {resident
                          ? `${resident.lastName}, ${resident.firstName}`
                          : "Unknown"}
                      </div>
                      <div className="font-mono text-xs text-stone-500">
                        {resident?.employeeId}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div>{camp?.name}</div>
                      <div className="font-mono text-xs text-stone-500">
                        {room ? `${room.block}-${room.roomNumber}` : "—"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs">
                      {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                    </td>
                    <td className="px-2 py-3">
                      <StatusPill status={booking.status} />
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
