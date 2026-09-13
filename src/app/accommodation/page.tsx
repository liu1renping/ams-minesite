import { AccommodationPanel } from "@/components/AccommodationPanel";
import { AppShell } from "@/components/AppShell";
import { type ApplicationRecord } from "@/lib/applications";
import { connectDB } from "@/lib/db";
import { Bedroom, House, VisitorApplication } from "@/lib/models";
import { getBookableBedrooms } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AccommodationPage() {
  await connectDB();

  const [docs, houses, bookableBedrooms] = await Promise.all([
    VisitorApplication.find({ status: "approved" })
      .sort({ decidedAt: -1, createdAt: -1 })
      .lean(),
    House.find({ status: "active" }).select("name code").sort({ name: 1 }).lean(),
    getBookableBedrooms(),
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

  const bedroomDocs =
    bookableBedrooms.length > 0
      ? bookableBedrooms
      : await Bedroom.find({ status: { $in: ["available", "occupied"] } })
          .select("label type houseId")
          .sort({ label: 1 })
          .lean();

  return (
    <AppShell pathname="/accommodation">
      <AccommodationPanel
        applications={applications}
        houses={houses.map((h) => ({
          _id: String(h._id),
          name: h.name,
          code: h.code,
        }))}
        bedrooms={bedroomDocs.map((b) => ({
          _id: String(b._id),
          houseId: String(b.houseId),
          label: b.label,
          type: b.type ?? "single",
        }))}
      />
    </AppShell>
  );
}
