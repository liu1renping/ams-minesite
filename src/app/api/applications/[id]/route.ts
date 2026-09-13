import { connectDB } from "@/lib/db";
import { jsonError, jsonOk, serialize } from "@/lib/api";
import { Booking, Camp, Resident, Room, VisitorApplication } from "@/lib/models";
import { APPLICATION_STATUSES } from "@/lib/types";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

function employeeIdFromEmail(email: string, fallback: string) {
  const local = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `VIS-${local || fallback.slice(-6).toUpperCase()}`;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return jsonError("Invalid application id", 400);
    }

    const body = await request.json();
    const application = await VisitorApplication.findById(id);

    if (!application) {
      return jsonError("Application not found", 404);
    }

    const action = String(body.action ?? "");

    if (action === "approve" || action === "reject") {
      if (application.status !== "submitted") {
        return jsonError("Only submitted applications can be decided by GM", 409);
      }

      application.status = action === "approve" ? "approved" : "rejected";
      application.gmNotes = String(body.gmNotes ?? "").trim();
      application.decidedAt = new Date();
      await application.save();

      return jsonOk(serialize(application));
    }

    if (action === "allocate") {
      if (application.status !== "approved") {
        return jsonError("Only approved applications can be allocated", 409);
      }

      if (!application.accommodationRequired) {
        application.status = "allocated";
        application.allocatedAt = new Date();
        application.gmNotes = [
          application.gmNotes,
          "Marked complete — accommodation not required.",
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        await application.save();
        return jsonOk(serialize(application));
      }

      const campId = String(body.campId ?? "");
      const roomId = String(body.roomId ?? "");

      if (!Types.ObjectId.isValid(campId) || !Types.ObjectId.isValid(roomId)) {
        return jsonError("Valid campId and roomId are required");
      }

      const [camp, room] = await Promise.all([
        Camp.findById(campId),
        Room.findById(roomId),
      ]);

      if (!camp) return jsonError("Camp not found", 404);
      if (!room) return jsonError("Room not found", 404);
      if (String(room.campId) !== campId) {
        return jsonError("Room does not belong to the selected camp");
      }

      const overlap = await Booking.findOne({
        roomId,
        status: { $in: ["reserved", "checked_in"] },
        checkIn: { $lt: application.departure },
        checkOut: { $gt: application.arrival },
      });

      if (overlap) {
        return jsonError("Room already booked for overlapping dates", 409);
      }

      const primary = application.travellers[0];
      if (!primary) return jsonError("Application has no travellers");

      let resident = await Resident.findOne({ email: primary.email });
      if (!resident) {
        const baseId = employeeIdFromEmail(primary.email, String(application._id));
        let employeeId = baseId;
        let suffix = 1;
        while (await Resident.exists({ employeeId })) {
          employeeId = `${baseId}-${suffix++}`;
        }

        const nameParts = primary.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "Visitor";
        const lastName = nameParts.slice(1).join(" ") || "Guest";

        resident = await Resident.create({
          employeeId,
          firstName,
          lastName,
          company: primary.company,
          role: "visitor",
          roster: "adhoc",
          phone: primary.phone ?? "",
          email: primary.email,
          active: true,
        });
      }

      await Booking.create({
        residentId: resident._id,
        roomId: room._id,
        campId: camp._id,
        checkIn: application.arrival,
        checkOut: application.departure,
        status: "reserved",
        purpose: application.reason,
        notes: `Visitor application ${application._id}`,
      } as Record<string, unknown>);

      const updated = await VisitorApplication.findByIdAndUpdate(
        application._id,
        {
          status: "allocated",
          campId: camp._id,
          roomId: room._id,
          allocatedAt: new Date(),
        },
        { new: true },
      )
        .populate("campId", "name code")
        .populate("roomId", "block roomNumber type");

      return jsonOk(serialize(updated));
    }

    if (
      body.status &&
      APPLICATION_STATUSES.includes(body.status as (typeof APPLICATION_STATUSES)[number])
    ) {
      return jsonError("Use action=approve|reject|allocate instead of raw status updates");
    }

    return jsonError("Unsupported action. Use approve, reject, or allocate.");
  } catch (error) {
    console.error(error);
    return jsonError(
      error instanceof Error ? error.message : "Failed to update application",
      400,
    );
  }
}
