import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { parseAmenities } from "@/lib/bedroom-input";
import { Bedroom, House } from "@/lib/models";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (houseId) filter.houseId = houseId;
    if (status) filter.status = status;

    const bedrooms = await Bedroom.find(filter)
      .populate("houseId", "name code address")
      .sort({ label: 1 });

    return jsonOk(serialize(bedrooms));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch bedrooms", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const required = ["houseId", "label", "type"] as const;
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return jsonError(`${field} is required`);
      }
    }

    if (!Types.ObjectId.isValid(String(body.houseId))) {
      return jsonError("Invalid houseId");
    }

    const house = await House.findById(body.houseId);
    if (!house) return jsonError("House not found", 404);

    const beds = body.beds === undefined ? 1 : Number(body.beds);
    if (Number.isNaN(beds) || beds < 1) {
      return jsonError("beds must be at least 1");
    }

    const bedroom = await Bedroom.create({
      houseId: body.houseId,
      label: String(body.label).trim(),
      type: body.type,
      beds,
      status: body.status ?? "available",
      amenities: parseAmenities(body.amenities),
    });

    const populated = await Bedroom.findById(bedroom._id).populate(
      "houseId",
      "name code address",
    );
    return jsonOk(serialize(populated), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create bedroom", 400);
  }
}
