import { AppShell } from "@/components/AppShell";
import { ResidentsManager, type ResidentRecord } from "@/components/ResidentsManager";
import { connectDB } from "@/lib/db";
import { Resident } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  await connectDB();
  const docs = await Resident.find().sort({ lastName: 1, firstName: 1 }).lean();

  const residents: ResidentRecord[] = docs.map((resident) => ({
    _id: String(resident._id),
    employeeId: resident.employeeId,
    firstName: resident.firstName,
    lastName: resident.lastName,
    company: resident.company,
    role: resident.role,
    roster: resident.roster,
    phone: resident.phone ?? "",
    email: resident.email ?? "",
    emergencyContact: resident.emergencyContact ?? "",
    active: resident.active,
  }));

  return (
    <AppShell pathname="/residents">
      <ResidentsManager residents={residents} />
    </AppShell>
  );
}
