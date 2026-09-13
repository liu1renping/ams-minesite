import { AppShell } from "@/components/AppShell";
import { HousesManager, type HouseRecord } from "@/components/HousesManager";
import { connectDB } from "@/lib/db";
import { House } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function HousesPage() {
  await connectDB();
  const docs = await House.find().sort({ name: 1 }).lean();

  const houses: HouseRecord[] = docs.map((house) => ({
    _id: String(house._id),
    name: house.name,
    code: house.code,
    address: house.address,
    suburb: house.suburb,
    status: house.status,
    notes: house.notes ?? "",
  }));

  return (
    <AppShell pathname="/houses">
      <HousesManager houses={houses} />
    </AppShell>
  );
}
