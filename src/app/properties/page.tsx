import { AppShell } from "@/components/AppShell";
import { PropertiesManager, type PropertyRecord } from "@/components/PropertiesManager";
import { connectDB } from "@/lib/db";
import { Bedroom, House } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  await connectDB();

  const [houseDocs, bedroomDocs] = await Promise.all([
    House.find().sort({ name: 1 }).lean(),
    Bedroom.find().sort({ label: 1 }).lean(),
  ]);

  const bedroomsByProperty = new Map<string, PropertyRecord["bedrooms"]>();
  for (const bedroom of bedroomDocs) {
    const propertyId = String(bedroom.houseId);
    const list = bedroomsByProperty.get(propertyId) ?? [];
    list.push({
      _id: String(bedroom._id),
      label: bedroom.label,
      type: bedroom.type,
      beds: bedroom.beds,
      status: bedroom.status,
      amenities: bedroom.amenities ?? [],
    });
    bedroomsByProperty.set(propertyId, list);
  }

  const properties: PropertyRecord[] = houseDocs.map((house) => ({
    _id: String(house._id),
    name: house.name,
    code: house.code,
    address: house.address,
    suburb: house.suburb,
    status: house.status,
    notes: house.notes ?? "",
    bedrooms: bedroomsByProperty.get(String(house._id)) ?? [],
  }));

  return (
    <AppShell pathname="/properties">
      <PropertiesManager properties={properties} />
    </AppShell>
  );
}
