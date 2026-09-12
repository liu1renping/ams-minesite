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
    const camp = await Camp.create(body);
    return jsonOk(serialize(camp), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create camp", 400);
  }
}
