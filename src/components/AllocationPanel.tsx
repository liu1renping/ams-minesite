"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatAppDate,
  travellerSummary,
  type ApplicationRecord,
} from "@/lib/applications";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";

type HouseOption = { _id: string; name: string; code: string };
type BedroomOption = {
  _id: string;
  houseId: string;
  label: string;
  type: string;
};

export function AllocationPanel({
  applications,
  houses,
  bedrooms,
}: {
  applications: ApplicationRecord[];
  houses: HouseOption[];
  bedrooms: BedroomOption[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [houseByApp, setHouseByApp] = useState<Record<string, string>>({});
  const [bedroomByApp, setBedroomByApp] = useState<Record<string, string>>({});

  const bedroomsByHouse = useMemo(() => {
    const map: Record<string, BedroomOption[]> = {};
    for (const bedroom of bedrooms) {
      map[bedroom.houseId] ??= [];
      map[bedroom.houseId].push(bedroom);
    }
    return map;
  }, [bedrooms]);

  function houseIdFor(appId: string) {
    return houseByApp[appId] || houses[0]?._id || "";
  }

  async function allocate(app: ApplicationRecord) {
    setPendingId(app._id);
    setError(null);

    const payload = app.accommodationRequired
      ? {
          action: "allocate",
          houseId: houseIdFor(app._id),
          bedroomId: bedroomByApp[app._id],
        }
      : { action: "allocate" };

    if (app.accommodationRequired && (!payload.houseId || !payload.bedroomId)) {
      setPendingId(null);
      setError("Select a property and bedroom before allocating.");
      return;
    }

    const res = await fetch(`/api/applications/${app._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPendingId(null);

    if (!res.ok) {
      setError(data.error ?? "Could not complete allocation");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          Allocation
        </h2>
        <p className="text-sm text-stone-400">
          Allocate property bedrooms independently for GM-approved visitor applications.
        </p>
      </div>

      <Panel title="Approved — awaiting bedroom allocation">
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

        {applications.length === 0 ? (
          <EmptyState message="No approved applications waiting for bedroom allocation." />
        ) : (
          <DataTable
            minWidthClass="min-w-[1100px]"
            headers={[
              "Travellers",
              "Host",
              "Stay",
              "Needs room",
              "Allocate bedroom",
              "Status",
              "Action",
            ]}
          >
            {applications.map((app) => {
              const selectedHouse = houseIdFor(app._id);
              const houseBedrooms = bedroomsByHouse[selectedHouse] ?? [];

              return (
                <tr key={app._id} className="text-stone-300">
                  <td className="px-2 py-3">
                    <div className="font-medium text-stone-100">
                      {travellerSummary(app.travellers)}
                    </div>
                    <div className="text-xs text-stone-500">
                      {app.travellers[0]?.email || "—"}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div>{app.hostName}</div>
                    <div className="text-xs text-stone-500">{app.reason}</div>
                  </td>
                  <td className="px-2 py-3 text-xs">
                    {formatAppDate(app.arrival)} → {formatAppDate(app.departure)}
                  </td>
                  <td className="px-2 py-3">
                    {app.accommodationRequired ? "Yes" : "No"}
                  </td>
                  <td className="px-2 py-3">
                    {app.accommodationRequired ? (
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <select
                          value={selectedHouse}
                          onChange={(e) => {
                            const nextHouse = e.target.value;
                            setHouseByApp((prev) => ({ ...prev, [app._id]: nextHouse }));
                            setBedroomByApp((prev) => ({ ...prev, [app._id]: "" }));
                          }}
                          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-100"
                        >
                          {houses.map((house) => (
                            <option key={house._id} value={house._id}>
                              {house.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={bedroomByApp[app._id] ?? ""}
                          onChange={(e) =>
                            setBedroomByApp((prev) => ({
                              ...prev,
                              [app._id]: e.target.value,
                            }))
                          }
                          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-100"
                        >
                          <option value="">Select bedroom</option>
                          {houseBedrooms.map((bedroom) => (
                            <option key={bedroom._id} value={bedroom._id}>
                              {bedroom.label} ({bedroom.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-500">Not required</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <StatusPill status={app.status} />
                  </td>
                  <td className="w-0 px-2 py-3 align-middle">
                    <button
                      type="button"
                      disabled={pendingId === app._id || houses.length === 0}
                      onClick={() => allocate(app)}
                      className="shrink-0 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {app.accommodationRequired ? "Allocate" : "Complete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
