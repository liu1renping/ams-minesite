import { AppShell } from "@/components/AppShell";
import { CampsManager, type CampRecord } from "@/components/CampsManager";
import { connectDB } from "@/lib/db";
import { Camp } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function CampsPage() {
  await connectDB();
  const docs = await Camp.find().sort({ name: 1 }).lean();

  const camps: CampRecord[] = docs.map((camp) => ({
    _id: String(camp._id),
    name: camp.name,
    code: camp.code,
    siteName: camp.siteName,
    location: camp.location,
    capacity: camp.capacity,
    status: camp.status,
    notes: camp.notes ?? "",
  }));

  return (
    <AppShell pathname="/camps">
      <CampsManager camps={camps} />
    </AppShell>
  );
}
