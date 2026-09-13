import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Camp } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();
    const camps = await Camp.find().sort({ name: 1 });
    return jsonOk(serialize(camps));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch camps", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const required = ["name", "code", "siteName", "location", "capacity"] as const;
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
        return jsonError(`${field} is required`);
      }
    }

    const capacity = Number(body.capacity);
    if (Number.isNaN(capacity) || capacity < 0) {
      return jsonError("capacity must be a non-negative number");
    }

    const camp = await Camp.create({
      name: String(body.name).trim(),
      code: String(body.code).trim().toUpperCase(),
      siteName: String(body.siteName).trim(),
      location: String(body.location).trim(),
      capacity,
      status: body.status ?? "active",
      notes: body.notes ?? "",
    });

    return jsonOk(serialize(camp), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create camp", 400);
  }
}
