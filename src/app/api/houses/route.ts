import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { normalizeBedroomInput, type BedroomInput } from "@/lib/bedroom-input";
import { Bedroom, House } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();
    const houses = await House.find().sort({ name: 1 });
    return jsonOk(serialize(houses));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch houses", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const required = ["name", "code", "address", "suburb"] as const;
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return jsonError(`${field} is required`);
      }
    }

    if (!Array.isArray(body.bedrooms) || body.bedrooms.length === 0) {
      return jsonError("At least one bedroom is required");
    }

    const bedrooms = (body.bedrooms as unknown[])
      .map((item) => normalizeBedroomInput(item))
      .filter((item: BedroomInput | null): item is BedroomInput => item !== null);

    if (bedrooms.length === 0) {
      return jsonError("At least one valid bedroom is required");
    }

    const house = await House.create({
      name: String(body.name).trim(),
      code: String(body.code).trim().toUpperCase(),
      address: String(body.address).trim(),
      suburb: String(body.suburb).trim(),
      status: body.status ?? "active",
      notes: body.notes ?? "",
    });

    await Bedroom.insertMany(
      bedrooms.map((bedroom: BedroomInput) => ({
        houseId: house._id,
        label: bedroom.label,
        type: bedroom.type,
        beds: bedroom.beds,
        status: bedroom.status,
        amenities: bedroom.amenities,
      })) as Record<string, unknown>[],
    );

    const populated = await House.findById(house._id);
    const createdBedrooms = await Bedroom.find({ houseId: String(house._id) }).sort({ label: 1 });

    return jsonOk(
      serialize({
        ...populated?.toObject(),
        bedrooms: createdBedrooms,
      }),
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create house", 400);
  }
}
