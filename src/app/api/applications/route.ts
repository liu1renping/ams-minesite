import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { VisitorApplication } from "@/lib/models";
import { DEPARTMENTS, VISIT_REASONS } from "@/lib/types";

type TravellerInput = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  photoIdFileName?: string;
};

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const applications = await VisitorApplication.find(filter)
      .populate("campId", "name code")
      .populate("roomId", "block roomNumber type")
      .sort({ createdAt: -1 })
      .limit(100);
    return jsonOk(serialize(applications));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch visitor applications", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!Array.isArray(body.travellers) || body.travellers.length === 0) {
      return jsonError("At least one traveller is required");
    }

    const travellers = (body.travellers as TravellerInput[]).map((traveller, index) => {
      if (!traveller.name?.trim() || !traveller.email?.trim() || !traveller.company?.trim()) {
        throw new Error(`Traveller ${index + 1} requires name, email, and company`);
      }
      return {
        name: traveller.name.trim(),
        email: traveller.email.trim(),
        phone: traveller.phone?.trim() ?? "",
        company: traveller.company.trim(),
        photoIdFileName: traveller.photoIdFileName?.trim() ?? "",
      };
    });

    if (!body.hostName?.trim()) return jsonError("hostName is required");
    if (!DEPARTMENTS.includes(body.department as (typeof DEPARTMENTS)[number])) {
      return jsonError("Invalid department");
    }
    if (!VISIT_REASONS.includes(body.reason as (typeof VISIT_REASONS)[number])) {
      return jsonError("Invalid reason");
    }

    const arrival = new Date(body.arrival);
    const departure = new Date(body.departure);
    if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) {
      return jsonError("Valid arrival and departure dates are required");
    }
    if (arrival > departure) {
      return jsonError("departure must be on or after arrival");
    }

    const applicationType = travellers.length > 1 ? "group" : "single";

    const application = await VisitorApplication.create({
      applicationType,
      travellers,
      hostName: String(body.hostName).trim(),
      hostTitle: String(body.hostTitle ?? "").trim(),
      department: body.department,
      reason: body.reason,
      arrival,
      departure,
      accommodationRequired: body.accommodationRequired !== false,
      carRego: String(body.carRego ?? "").trim(),
      status: "submitted",
    });

    return jsonOk(serialize(application), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(
      error instanceof Error ? error.message : "Failed to submit visitor application",
      400,
    );
  }
}
