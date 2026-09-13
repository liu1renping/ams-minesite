import { AppShell } from "@/components/AppShell";
import { BookingActions } from "@/components/BookingActions";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingsPage() {
  await connectDB();
  const bookings = await Booking.find()
    .populate("residentId", "firstName lastName employeeId company")
    .populate("bedroomId", "label type")
    .populate("houseId", "name code")
    .sort({ checkIn: -1 })
    .lean();

  return (
    <AppShell pathname="/bookings">
      <Panel title="Bookings & allocations">
        {bookings.length === 0 ? (
          <EmptyState message="No bookings found." />
        ) : (
          <DataTable
            headers={["Resident", "House / Bedroom", "Stay", "Purpose", "Status", "Actions"]}
          >
            {bookings.map((booking) => {
              const resident = booking.residentId as {
                firstName?: string;
                lastName?: string;
                employeeId?: string;
                company?: string;
              } | null;
              const bedroom = booking.bedroomId as {
                label?: string;
                type?: string;
              } | null;
              const house = booking.houseId as { name?: string; code?: string } | null;

              return (
                <tr key={String(booking._id)} className="text-stone-300">
                  <td className="px-2 py-3">
                    <div className="font-medium text-stone-100">
                      {resident
                        ? `${resident.lastName}, ${resident.firstName}`
                        : "Unknown"}
                    </div>
                    <div className="text-xs text-stone-500">
                      {resident?.employeeId} · {resident?.company}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div>{house?.name}</div>
                    <div className="font-mono text-xs text-stone-500">
                      {bedroom ? `${bedroom.label} · ${bedroom.type}` : "—"}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs">
                    {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                  </td>
                  <td className="px-2 py-3 capitalize">{booking.purpose}</td>
                  <td className="px-2 py-3">
                    <StatusPill status={booking.status} />
                  </td>
                  <td className="px-2 py-3">
                    <BookingActions id={String(booking._id)} status={booking.status} />
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
