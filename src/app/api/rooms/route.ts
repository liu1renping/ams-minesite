import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Room } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get("campId");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (campId) filter.campId = campId;
    if (status) filter.status = status;

    const rooms = await Room.find(filter)
      .populate("campId", "name code")
      .sort({ block: 1, roomNumber: 1 });

    return jsonOk(serialize(rooms));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch rooms", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const room = await Room.create(body);
    return jsonOk(serialize(room), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create room", 400);
  }
}
