import { AppShell } from "@/components/AppShell";
import { QuickBookingForm } from "@/components/QuickBookingForm";
import { DataTable, EmptyState, Panel, StatCard, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { House, Resident } from "@/lib/models";
import {
  getBookableBedrooms,
  getDashboardStats,
  getHousesWithOccupancy,
  getRecentBookings,
} from "@/lib/queries";

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
    houses: 0,
    bedrooms: 0,
    residents: 0,
    activeBookings: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    occupancyRate: 0,
  };
  let houses: Awaited<ReturnType<typeof getHousesWithOccupancy>> = [];
  let bookings: Awaited<ReturnType<typeof getRecentBookings>> = [];
  let formHouses: Array<{ _id: string; name: string }> = [];
  let formBedrooms: Array<{
    _id: string;
    label: string;
    houseId: string | { _id: string };
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
    const [nextStats, nextHouses, nextBookings, houseDocs, bedroomDocs, residentDocs] =
      await Promise.all([
        getDashboardStats(),
        getHousesWithOccupancy(),
        getRecentBookings(),
        House.find().select("name").sort({ name: 1 }).lean(),
        getBookableBedrooms(),
        Resident.find({ active: true })
          .select("firstName lastName employeeId")
          .sort({ lastName: 1 })
          .lean(),
      ]);

    stats = nextStats;
    houses = nextHouses;
    bookings = nextBookings;
    formHouses = houseDocs.map((h) => ({ _id: String(h._id), name: h.name }));
    formBedrooms = bedroomDocs.map((b) => ({
      _id: String(b._id),
      label: b.label,
      houseId: String(b.houseId),
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
        <StatCard label="Active houses" value={stats.houses} />
        <StatCard
          label="Bedroom occupancy"
          value={`${stats.occupancyRate}%`}
          hint={`${stats.occupied} occupied · ${stats.available} available`}
        />
        <StatCard label="Active residents" value={stats.residents} />
        <StatCard
          label="Checked in"
          value={stats.activeBookings}
          hint={`${stats.maintenance} bedrooms in maintenance`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="House occupancy">
            {houses.length === 0 ? (
              <EmptyState message="No houses yet. Run npm run seed or add houses." />
            ) : (
              <DataTable headers={["House", "Code", "Bedrooms", "Occupied", "Available", "Status"]}>
                {houses.map((house) => (
                  <tr key={String(house._id)} className="text-stone-300">
                    <td className="px-2 py-3 font-medium text-stone-100">{house.name}</td>
                    <td className="px-2 py-3 font-mono text-xs">{house.code}</td>
                    <td className="px-2 py-3">{house.bedroomStats.total}</td>
                    <td className="px-2 py-3">{house.bedroomStats.occupied}</td>
                    <td className="px-2 py-3">{house.bedroomStats.available}</td>
                    <td className="px-2 py-3">
                      <StatusPill status={house.status} />
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
              houses={formHouses}
              bedrooms={formBedrooms}
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
            <DataTable headers={["Resident", "House / Bedroom", "Stay", "Status"]}>
              {bookings.map((booking) => {
                const resident = booking.residentId as {
                  firstName?: string;
                  lastName?: string;
                  employeeId?: string;
                } | null;
                const bedroom = booking.bedroomId as { label?: string } | null;
                const house = booking.houseId as { name?: string; code?: string } | null;

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
                      <div>{house?.name}</div>
                      <div className="font-mono text-xs text-stone-500">
                        {bedroom?.label ?? "—"}
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
