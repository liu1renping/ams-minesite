import { AppShell } from "@/components/AppShell";
import { GmApprovalPanel } from "@/components/GmApprovalPanel";
import { type ApplicationRecord } from "@/lib/applications";
import { connectDB } from "@/lib/db";
import { VisitorApplication } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function GmApprovalPage() {
  await connectDB();
  const docs = await VisitorApplication.find({ status: "submitted" })
    .sort({ createdAt: -1 })
    .lean();

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
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : undefined,
  }));

  return (
    <AppShell pathname="/gm-approval">
      <GmApprovalPanel applications={applications} />
    </AppShell>
  );
}
