import { AppShell } from "@/components/AppShell";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { Resident } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  await connectDB();
  const residents = await Resident.find().sort({ lastName: 1, firstName: 1 }).lean();

  return (
    <AppShell pathname="/residents">
      <Panel title="Residents & workforce">
        {residents.length === 0 ? (
          <EmptyState message="No residents found. Run npm run seed." />
        ) : (
          <DataTable
            headers={[
              "Employee ID",
              "Name",
              "Company",
              "Role",
              "Roster",
              "Contact",
              "Status",
            ]}
          >
            {residents.map((resident) => (
              <tr key={String(resident._id)} className="text-stone-300">
                <td className="px-2 py-3 font-mono text-xs">{resident.employeeId}</td>
                <td className="px-2 py-3 font-medium text-stone-100">
                  {resident.lastName}, {resident.firstName}
                </td>
                <td className="px-2 py-3">{resident.company}</td>
                <td className="px-2 py-3 capitalize">{resident.role}</td>
                <td className="px-2 py-3 font-mono text-xs">{resident.roster}</td>
                <td className="px-2 py-3 text-xs text-stone-400">
                  {resident.phone || resident.email || "—"}
                </td>
                <td className="px-2 py-3">
                  <StatusPill status={resident.active ? "active" : "inactive"} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
