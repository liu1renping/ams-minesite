"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatAppDate,
  travellerSummary,
  type ApplicationRecord,
} from "@/lib/applications";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";

type CampOption = { _id: string; name: string; code: string };
type RoomOption = {
  _id: string;
  campId: string;
  block: string;
  roomNumber: string;
  type: string;
};

export function AccommodationPanel({
  applications,
  camps,
  rooms,
}: {
  applications: ApplicationRecord[];
  camps: CampOption[];
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campByApp, setCampByApp] = useState<Record<string, string>>({});
  const [roomByApp, setRoomByApp] = useState<Record<string, string>>({});

  const roomsByCamp = useMemo(() => {
    const map: Record<string, RoomOption[]> = {};
    for (const room of rooms) {
      map[room.campId] ??= [];
      map[room.campId].push(room);
    }
    return map;
  }, [rooms]);

  function campIdFor(appId: string) {
    return campByApp[appId] || camps[0]?._id || "";
  }

  async function allocate(app: ApplicationRecord) {
    setPendingId(app._id);
    setError(null);

    const payload = app.accommodationRequired
      ? {
          action: "allocate",
          campId: campIdFor(app._id),
          roomId: roomByApp[app._id],
        }
      : { action: "allocate" };

    if (app.accommodationRequired && (!payload.campId || !payload.roomId)) {
      setPendingId(null);
      setError("Select a camp and room before allocating.");
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
      setError(data.error ?? "Could not allocate accommodation");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          Accommodation
        </h2>
        <p className="text-sm text-stone-400">
          Allocate rooms for GM-approved visitor applications.
        </p>
      </div>

      <Panel title="Approved — awaiting allocation">
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

        {applications.length === 0 ? (
          <EmptyState message="No approved applications waiting for room allocation." />
        ) : (
          <DataTable
            minWidthClass="min-w-[1100px]"
            headers={[
              "Travellers",
              "Host",
              "Stay",
              "Needs room",
              "Allocate",
              "Status",
              "Action",
            ]}
          >
            {applications.map((app) => {
              const selectedCamp = campIdFor(app._id);
              const campRooms = roomsByCamp[selectedCamp] ?? [];

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
                          value={selectedCamp}
                          onChange={(e) => {
                            const nextCamp = e.target.value;
                            setCampByApp((prev) => ({ ...prev, [app._id]: nextCamp }));
                            setRoomByApp((prev) => ({ ...prev, [app._id]: "" }));
                          }}
                          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-100"
                        >
                          {camps.map((camp) => (
                            <option key={camp._id} value={camp._id}>
                              {camp.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={roomByApp[app._id] ?? ""}
                          onChange={(e) =>
                            setRoomByApp((prev) => ({
                              ...prev,
                              [app._id]: e.target.value,
                            }))
                          }
                          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-100"
                        >
                          <option value="">Select room</option>
                          {campRooms.map((room) => (
                            <option key={room._id} value={room._id}>
                              {room.block}-{room.roomNumber} ({room.type})
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
                      disabled={pendingId === app._id || camps.length === 0}
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
