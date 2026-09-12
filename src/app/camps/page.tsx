import { AppShell } from "@/components/AppShell";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { connectDB } from "@/lib/db";
import { Camp } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function CampsPage() {
  await connectDB();
  const camps = await Camp.find().sort({ name: 1 }).lean();

  return (
    <AppShell pathname="/camps">
      <Panel title="Camps & villages">
        {camps.length === 0 ? (
          <EmptyState message="No camps found. Run npm run seed." />
        ) : (
          <DataTable
            headers={["Name", "Code", "Site", "Location", "Capacity", "Status"]}
          >
            {camps.map((camp) => (
              <tr key={String(camp._id)} className="text-stone-300">
                <td className="px-2 py-3 font-medium text-stone-100">{camp.name}</td>
                <td className="px-2 py-3 font-mono text-xs">{camp.code}</td>
                <td className="px-2 py-3">{camp.siteName}</td>
                <td className="px-2 py-3">{camp.location}</td>
                <td className="px-2 py-3">{camp.capacity}</td>
                <td className="px-2 py-3">
                  <StatusPill status={camp.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
