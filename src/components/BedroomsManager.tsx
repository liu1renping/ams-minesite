"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { BEDROOM_STATUSES, BEDROOM_TYPES } from "@/lib/types";

export type HouseOption = { _id: string; name: string; code: string };

export type BedroomRecord = {
  _id: string;
  houseId: string;
  houseName: string;
  houseCode: string;
  label: string;
  type: string;
  beds: number;
  status: string;
  amenities: string[];
};

type FormState = {
  houseId: string;
  label: string;
  type: string;
  beds: string;
  status: string;
  amenities: string;
};

function emptyForm(houses: HouseOption[]): FormState {
  return {
    houseId: houses[0]?._id ?? "",
    label: "",
    type: "single",
    beds: "1",
    status: "available",
    amenities: "",
  };
}

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function BedroomsManager({
  bedrooms,
  houses,
}: {
  bedrooms: BedroomRecord[];
  houses: HouseOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(houses));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bedrooms;
    return bedrooms.filter((b) =>
      [b.houseName, b.houseCode, b.label, b.type, b.status, b.amenities.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [bedrooms, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(houses));
    setError(null);
  }

  function startEdit(bedroom: BedroomRecord) {
    setEditingId(bedroom._id);
    setForm({
      houseId: bedroom.houseId,
      label: bedroom.label,
      type: bedroom.type,
      beds: String(bedroom.beds),
      status: bedroom.status,
      amenities: bedroom.amenities.join(", "),
    });
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
      houseId: form.houseId,
      label: form.label.trim(),
      type: form.type,
      beds: Number(form.beds),
      status: form.status,
      amenities: form.amenities,
    };

    const res = await fetch(isEditing ? `/api/bedrooms/${editingId}` : "/api/bedrooms", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save bedroom");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete bedroom ${label}? This cannot be undone.`)) return;
    setPending(true);
    setError(null);

    const res = await fetch(`/api/bedrooms/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete bedroom");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  if (houses.length === 0) {
    return (
      <Panel title="Bedrooms">
        <EmptyState message="Create a house first before adding bedrooms." />
      </Panel>
    );
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit bedroom" : "Add bedroom"}
        action={
          isEditing ? (
            <button type="button" onClick={resetForm} className="text-xs text-stone-400 hover:text-stone-200">
              Cancel edit
            </button>
          ) : null
        }
      >
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            House
            <select required value={form.houseId} onChange={(e) => updateField("houseId", e.target.value)} className={fieldClass}>
              {houses.map((house) => (
                <option key={house._id} value={house._id}>
                  {house.name} ({house.code})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Bedroom label
            <input required value={form.label} onChange={(e) => updateField("label", e.target.value)} className={fieldClass} placeholder="Bedroom 1" />
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Type
            <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className={fieldClass}>
              {BEDROOM_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Beds
            <input required type="number" min={1} value={form.beds} onChange={(e) => updateField("beds", e.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Status
            <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={fieldClass}>
              {BEDROOM_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Amenities
            <input value={form.amenities} onChange={(e) => updateField("amenities", e.target.value)} className={fieldClass} placeholder="ensuite, desk, AC" />
          </label>
          {error ? <p className="text-sm text-rose-300 sm:col-span-2 lg:col-span-4">{error}</p> : null}
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={pending} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:opacity-60">
              {pending ? "Saving…" : isEditing ? "Update bedroom" : "Add bedroom"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Bedrooms"
        action={
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-40 rounded-md border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-100 sm:w-52" />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState message="No bedrooms match. Add one with the form." />
        ) : (
          <DataTable minWidthClass="min-w-[800px]" headers={["House", "Bedroom", "Type", "Beds", "Status", "Actions"]}>
            {filtered.map((bedroom) => (
              <tr key={bedroom._id} className="text-stone-300">
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">{bedroom.houseName}</div>
                  <div className="font-mono text-xs text-stone-500">{bedroom.houseCode}</div>
                </td>
                <td className="px-2 py-3">
                  <div className="text-stone-100">{bedroom.label}</div>
                  <div className="text-xs text-stone-500">{bedroom.amenities.join(", ") || "—"}</div>
                </td>
                <td className="px-2 py-3 capitalize">{bedroom.type}</td>
                <td className="px-2 py-3">{bedroom.beds}</td>
                <td className="px-2 py-3"><StatusPill status={bedroom.status} /></td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button type="button" disabled={pending} onClick={() => startEdit(bedroom)} className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50">Edit</button>
                    <button type="button" disabled={pending} onClick={() => onDelete(bedroom._id, bedroom.label)} className="shrink-0 rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50">Delete</button>
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
