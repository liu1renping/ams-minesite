"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatAppDate,
  travellerSummary,
  type ApplicationRecord,
} from "@/lib/applications";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";

export function GmApprovalPanel({ applications }: { applications: ApplicationRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    const label = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this application?`)) return;

    setPendingId(id);
    setError(null);

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    setPendingId(null);

    if (!res.ok) {
      setError(data.error ?? `Could not ${label} application`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          GM Approval
        </h2>
        <p className="text-sm text-stone-400">
          Review submitted visitor applications waiting for GM approval.
        </p>
      </div>

      <Panel title="Pending applications">
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

        {applications.length === 0 ? (
          <EmptyState message="No applications waiting for GM approval." />
        ) : (
          <DataTable
            minWidthClass="min-w-[960px]"
            headers={[
              "Travellers",
              "Host",
              "Visit",
              "Stay",
              "Accommodation",
              "Status",
              "Actions",
            ]}
          >
            {applications.map((app) => (
              <tr key={app._id} className="text-stone-300">
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">
                    {travellerSummary(app.travellers)}
                  </div>
                  <div className="text-xs text-stone-500">
                    {app.travellers[0]?.company || "—"} · {app.applicationType}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="text-stone-100">{app.hostName}</div>
                  <div className="text-xs text-stone-500">
                    {[app.hostTitle, app.department].filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div>{app.reason}</div>
                  <div className="text-xs text-stone-500">{app.carRego || "No rego"}</div>
                </td>
                <td className="px-2 py-3 text-xs">
                  {formatAppDate(app.arrival)} → {formatAppDate(app.departure)}
                </td>
                <td className="px-2 py-3">
                  {app.accommodationRequired ? "Yes" : "No"}
                </td>
                <td className="px-2 py-3">
                  <StatusPill status={app.status} />
                </td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pendingId === app._id}
                      onClick={() => decide(app._id, "approve")}
                      className="shrink-0 rounded-md bg-emerald-700/80 px-2.5 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === app._id}
                      onClick={() => decide(app._id, "reject")}
                      className="shrink-0 rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
