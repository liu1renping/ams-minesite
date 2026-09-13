import { AppShell } from "@/components/AppShell";
import {
  BedroomsManager,
  type BedroomRecord,
  type HouseOption,
} from "@/components/BedroomsManager";
import { connectDB } from "@/lib/db";
import { Bedroom, House } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function BedroomsPage() {
  await connectDB();

  const [bedroomDocs, houseDocs] = await Promise.all([
    Bedroom.find().populate("houseId", "name code").sort({ label: 1 }).lean(),
    House.find().select("name code").sort({ name: 1 }).lean(),
  ]);

  const houses: HouseOption[] = houseDocs.map((house) => ({
    _id: String(house._id),
    name: house.name,
    code: house.code,
  }));

  const bedrooms: BedroomRecord[] = bedroomDocs.map((bedroom) => {
    const house = bedroom.houseId as { _id?: unknown; name?: string; code?: string } | null;
    return {
      _id: String(bedroom._id),
      houseId: house?._id ? String(house._id) : String(bedroom.houseId),
      houseName: house?.name ?? "Unknown",
      houseCode: house?.code ?? "—",
      label: bedroom.label,
      type: bedroom.type,
      beds: bedroom.beds,
      status: bedroom.status,
      amenities: bedroom.amenities ?? [],
    };
  });

  return (
    <AppShell pathname="/bedrooms">
      <BedroomsManager bedrooms={bedrooms} houses={houses} />
    </AppShell>
  );
}
