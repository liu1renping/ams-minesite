import { AccommodationPanel } from "@/components/AccommodationPanel";
import { AppShell } from "@/components/AppShell";
import { type ApplicationRecord } from "@/lib/applications";
import { connectDB } from "@/lib/db";
import { Camp, Room, VisitorApplication } from "@/lib/models";
import { getBookableRooms } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AccommodationPage() {
  await connectDB();

  const [docs, camps, bookableRooms] = await Promise.all([
    VisitorApplication.find({ status: "approved" }).sort({ decidedAt: -1, createdAt: -1 }).lean(),
    Camp.find({ status: "active" }).select("name code").sort({ name: 1 }).lean(),
    getBookableRooms(),
  ]);

  const applications: ApplicationRecord[] = docs.map((app) => ({
    _id: String(app._id),
    applicationType: app.applicationType,
    travellers: app.travellers.map((t) => ({
      name: t.name,
      email: t.email,
      phone: t.phone ?? "",
      company: t.company,
      photoIdFileName: t.photoIdFileName ?? "",
    })),
    hostName: app.hostName,
    hostTitle: app.hostTitle ?? "",
    department: app.department,
    reason: app.reason,
    arrival: new Date(app.arrival).toISOString(),
    departure: new Date(app.departure).toISOString(),
    accommodationRequired: app.accommodationRequired,
    carRego: app.carRego ?? "",
    status: app.status,
    gmNotes: app.gmNotes ?? "",
  }));

  // Include occupied rooms that are still selectable if bookable list is empty for a camp —
  // allocation uses date overlap checks on the API. Prefer bookable rooms first.
  const roomDocs =
    bookableRooms.length > 0
      ? bookableRooms
      : await Room.find({ status: { $in: ["available", "occupied"] } })
          .select("block roomNumber campId type")
          .sort({ block: 1, roomNumber: 1 })
          .lean();

  return (
    <AppShell pathname="/accommodation">
      <AccommodationPanel
        applications={applications}
        camps={camps.map((c) => ({
          _id: String(c._id),
          name: c.name,
          code: c.code,
        }))}
        rooms={roomDocs.map((r) => ({
          _id: String(r._id),
          campId: String(r.campId),
          block: r.block,
          roomNumber: r.roomNumber,
          type: r.type ?? "single",
        }))}
      />
    </AppShell>
  );
}
