import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { House } from "@/lib/models";

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

    const house = await House.create({
      name: String(body.name).trim(),
      code: String(body.code).trim().toUpperCase(),
      address: String(body.address).trim(),
      suburb: String(body.suburb).trim(),
      status: body.status ?? "active",
      notes: body.notes ?? "",
    });

    return jsonOk(serialize(house), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create house", 400);
  }
}
