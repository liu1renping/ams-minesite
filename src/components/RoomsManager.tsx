"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { ROOM_STATUSES, ROOM_TYPES } from "@/lib/types";

export type CampOption = {
  _id: string;
  name: string;
  code: string;
};

export type RoomRecord = {
  _id: string;
  campId: string;
  campName: string;
  campCode: string;
  block: string;
  roomNumber: string;
  type: string;
  beds: number;
  status: string;
  amenities: string[];
};

type FormState = {
  campId: string;
  block: string;
  roomNumber: string;
  type: string;
  beds: string;
  status: string;
  amenities: string;
};

function emptyForm(camps: CampOption[]): FormState {
  return {
    campId: camps[0]?._id ?? "",
    block: "",
    roomNumber: "",
    type: "single",
    beds: "1",
    status: "available",
    amenities: "",
  };
}

function toForm(room: RoomRecord): FormState {
  return {
    campId: room.campId,
    block: room.block,
    roomNumber: room.roomNumber,
    type: room.type,
    beds: String(room.beds),
    status: room.status,
    amenities: room.amenities.join(", "),
  };
}

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function RoomsManager({
  rooms,
  camps,
}: {
  rooms: RoomRecord[];
  camps: CampOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(camps));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) =>
      [
        r.campName,
        r.campCode,
        r.block,
        r.roomNumber,
        r.type,
        r.status,
        r.amenities.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rooms, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(camps));
    setError(null);
  }

  function startEdit(room: RoomRecord) {
    setEditingId(room._id);
    setForm(toForm(room));
    setError(null);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      campId: form.campId,
      block: form.block.trim(),
      roomNumber: form.roomNumber.trim(),
      type: form.type,
      beds: Number(form.beds),
      status: form.status,
      amenities: form.amenities,
    };

    const res = await fetch(
      isEditing ? `/api/rooms/${editingId}` : "/api/rooms",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save room");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete room ${label}? This cannot be undone.`)) return;

    setPending(true);
    setError(null);

    const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete room");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  if (camps.length === 0) {
    return (
      <Panel title="Room inventory">
        <EmptyState message="Create a camp first before adding rooms." />
      </Panel>
    );
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit room" : "Add room"}
        action={
          isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Cancel edit
            </button>
          ) : null
        }
      >
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Camp
            <select
              required
              value={form.campId}
              onChange={(e) => updateField("campId", e.target.value)}
              className={fieldClass}
            >
              {camps.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.name} ({camp.code})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Block
            <input
              required
              value={form.block}
              onChange={(e) => updateField("block", e.target.value)}
              className={fieldClass}
              placeholder="A"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Room number
            <input
              required
              value={form.roomNumber}
              onChange={(e) => updateField("roomNumber", e.target.value)}
              className={fieldClass}
              placeholder="01"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Type
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className={fieldClass}
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Beds
            <input
              required
              type="number"
              min={1}
              value={form.beds}
              onChange={(e) => updateField("beds", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className={fieldClass}
            >
              {ROOM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Amenities
            <input
              value={form.amenities}
              onChange={(e) => updateField("amenities", e.target.value)}
              className={fieldClass}
              placeholder="AC, desk, ensuite"
            />
            <span className="text-[11px] text-stone-500">Comma-separated list</span>
          </label>

          {error ? (
            <p className="text-sm text-rose-300 sm:col-span-2 lg:col-span-4">{error}</p>
          ) : null}

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEditing ? "Update room" : "Add room"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Room inventory"
        action={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-40 rounded-md border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-100 sm:w-52"
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState message="No rooms match. Add one with the form." />
        ) : (
          <DataTable
            minWidthClass="min-w-[800px]"
            headers={["Camp", "Room", "Type", "Beds", "Status", "Actions"]}
          >
            {filtered.map((room) => (
              <tr key={room._id} className="text-stone-300">
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">{room.campName}</div>
                  <div className="font-mono text-xs text-stone-500">{room.campCode}</div>
                </td>
                <td className="px-2 py-3">
                  <div className="font-mono text-xs text-stone-100">
                    {room.block}-{room.roomNumber}
                  </div>
                  <div className="text-xs text-stone-500">
                    {room.amenities.join(", ") || "—"}
                  </div>
                </td>
                <td className="px-2 py-3 capitalize">{room.type}</td>
                <td className="px-2 py-3">{room.beds}</td>
                <td className="px-2 py-3">
                  <StatusPill status={room.status} />
                </td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(room)}
                      className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        onDelete(room._id, `${room.block}-${room.roomNumber}`)
                      }
                      className="shrink-0 rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50"
                    >
                      Delete
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
