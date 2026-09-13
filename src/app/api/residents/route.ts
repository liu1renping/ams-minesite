import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Resident } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const filter = q
      ? {
          $or: [
            { firstName: new RegExp(q, "i") },
            { lastName: new RegExp(q, "i") },
            { employeeId: new RegExp(q, "i") },
            { company: new RegExp(q, "i") },
          ],
        }
      : {};

    const residents = await Resident.find(filter).sort({ lastName: 1, firstName: 1 });
    return jsonOk(serialize(residents));
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch residents", 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const required = ["employeeId", "firstName", "lastName", "company", "role"] as const;
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return jsonError(`${field} is required`);
      }
    }

    const resident = await Resident.create({
      employeeId: String(body.employeeId).trim(),
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      company: String(body.company).trim(),
      role: body.role,
      roster: body.roster ?? "2/1",
      phone: body.phone ?? "",
      email: body.email ?? "",
      emergencyContact: body.emergencyContact ?? "",
      active: body.active !== false,
    });

    return jsonOk(serialize(resident), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create resident", 400);
  }
}
