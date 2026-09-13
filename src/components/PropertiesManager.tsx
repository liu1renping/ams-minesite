"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { BEDROOM_STATUSES, BEDROOM_TYPES, HOUSE_STATUSES } from "@/lib/types";

export type BedroomRecord = {
  _id: string;
  label: string;
  type: string;
  beds: number;
  status: string;
  amenities: string[];
};

export type PropertyRecord = {
  _id: string;
  name: string;
  code: string;
  address: string;
  suburb: string;
  status: string;
  notes: string;
  bedrooms: BedroomRecord[];
};

type BedroomFormRow = {
  key: string;
  _id?: string;
  label: string;
  type: string;
  beds: string;
  status: string;
  amenities: string;
};

type PropertyFormState = {
  name: string;
  code: string;
  address: string;
  suburb: string;
  status: string;
  notes: string;
  bedrooms: BedroomFormRow[];
};

function newBedroomRow(partial?: Partial<BedroomFormRow>): BedroomFormRow {
  return {
    key: partial?._id ?? `new-${crypto.randomUUID()}`,
    _id: partial?._id,
    label: partial?.label ?? "",
    type: partial?.type ?? "single",
    beds: partial?.beds ?? "1",
    status: partial?.status ?? "available",
    amenities: partial?.amenities ?? "",
  };
}

const emptyForm: PropertyFormState = {
  name: "",
  code: "",
  address: "",
  suburb: "",
  status: "active",
  notes: "",
  bedrooms: [newBedroomRow({ label: "Bedroom 1" })],
};

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function PropertiesManager({ properties }: { properties: PropertyRecord[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((house) => {
      const bedroomText = house.bedrooms
        .map((b) => [b.label, b.type, b.status, b.amenities.join(" ")].join(" "))
        .join(" ");
      return [house.name, house.code, house.address, house.suburb, house.status, house.notes, bedroomText]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [properties, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(house: PropertyRecord) {
    setEditingId(house._id);
    setForm({
      name: house.name,
      code: house.code,
      address: house.address,
      suburb: house.suburb,
      status: house.status,
      notes: house.notes ?? "",
      bedrooms:
        house.bedrooms.length > 0
          ? house.bedrooms.map((bedroom) =>
              newBedroomRow({
                _id: bedroom._id,
                label: bedroom.label,
                type: bedroom.type,
                beds: String(bedroom.beds),
                status: bedroom.status,
                amenities: bedroom.amenities.join(", "),
              }),
            )
          : [newBedroomRow({ label: "Bedroom 1" })],
    });
    setError(null);
  }

  function updateField<K extends keyof Omit<PropertyFormState, "bedrooms">>(
    key: K,
    value: PropertyFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBedroom(index: number, key: keyof BedroomFormRow, value: string) {
    setForm((prev) => ({
      ...prev,
      bedrooms: prev.bedrooms.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  }

  function addBedroomRow() {
    setForm((prev) => ({
      ...prev,
      bedrooms: [...prev.bedrooms, newBedroomRow({ label: `Bedroom ${prev.bedrooms.length + 1}` })],
    }));
  }

  function removeBedroomRow(index: number) {
    setForm((prev) => {
      if (prev.bedrooms.length <= 1) return prev;
      return {
        ...prev,
        bedrooms: prev.bedrooms.filter((_, i) => i !== index),
      };
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address.trim(),
      suburb: form.suburb.trim(),
      status: form.status,
      notes: form.notes.trim(),
      bedrooms: form.bedrooms.map((row) => ({
        ...(row._id ? { _id: row._id } : {}),
        label: row.label.trim(),
        type: row.type,
        beds: Number(row.beds),
        status: row.status,
        amenities: row.amenities,
      })),
    };

    const res = await fetch(isEditing ? `/api/houses/${editingId}` : "/api/houses", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save property");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete property ${label} and all its bedrooms? This cannot be undone.`)) {
      return;
    }
    setPending(true);
    setError(null);

    const res = await fetch(`/api/houses/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete property");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit property" : "Add property"}
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
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={fieldClass}
                placeholder="Riverbend House"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-400">
              Code
              <input
                required
                value={form.code}
                onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                className={fieldClass}
                placeholder="RB01"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-400">
              Status
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className={fieldClass}
              >
                {HOUSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
              Address
              <input
                required
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={fieldClass}
                placeholder="12 Mine Road"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
              Suburb / town
              <input
                required
                value={form.suburb}
                onChange={(e) => updateField("suburb", e.target.value)}
                className={fieldClass}
                placeholder="Newman, WA"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-400 lg:col-span-4">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={2}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-stone-200">Bedrooms</h3>
              <button
                type="button"
                onClick={addBedroomRow}
                className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-medium text-stone-950 shadow-sm ring-1 ring-amber-400/50 hover:bg-amber-400"
              >
                + Add bedroom
              </button>
            </div>

            <div className="grid gap-3">
              {form.bedrooms.map((row, index) => (
                <div
                  key={row.key}
                  className="grid gap-3 rounded-md border border-stone-800/80 bg-stone-900/30 p-3 sm:grid-cols-2 lg:grid-cols-6"
                >
                  <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
                    Label
                    <input
                      required
                      value={row.label}
                      onChange={(e) => updateBedroom(index, "label", e.target.value)}
                      className={fieldClass}
                      placeholder="Master Bedroom"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-stone-400">
                    Type
                    <select
                      value={row.type}
                      onChange={(e) => updateBedroom(index, "type", e.target.value)}
                      className={fieldClass}
                    >
                      {BEDROOM_TYPES.map((type) => (
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
                      value={row.beds}
                      onChange={(e) => updateBedroom(index, "beds", e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-stone-400">
                    Status
                    <select
                      value={row.status}
                      onChange={(e) => updateBedroom(index, "status", e.target.value)}
                      className={fieldClass}
                    >
                      {BEDROOM_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
                    Amenities
                    <input
                      value={row.amenities}
                      onChange={(e) => updateBedroom(index, "amenities", e.target.value)}
                      className={fieldClass}
                      placeholder="ensuite, desk, AC"
                    />
                  </label>
                  <div className="flex items-end lg:col-span-4">
                    {form.bedrooms.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeBedroomRow(index)}
                        className="rounded-md bg-rose-900/40 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-900/60"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEditing ? "Update property" : "Add property"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Properties & bedrooms"
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
          <EmptyState message="No properties match. Add one with the form." />
        ) : (
          <div className="grid gap-4">
            {filtered.map((house) => (
              <div
                key={house._id}
                className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950/30"
              >
                <div className="flex flex-col gap-3 border-b border-stone-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-stone-100">{house.name}</h3>
                      <span className="font-mono text-xs text-stone-500">{house.code}</span>
                      <StatusPill status={house.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-400">
                      {house.address}, {house.suburb}
                    </p>
                    {house.notes ? (
                      <p className="mt-1 text-xs text-stone-500">{house.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(house)}
                      className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDelete(house._id, house.name)}
                      className="shrink-0 rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {house.bedrooms.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-stone-500">No bedrooms yet.</div>
                ) : (
                  <DataTable
                    minWidthClass="min-w-[640px]"
                    headers={["Bedroom", "Type", "Beds", "Status", "Amenities"]}
                  >
                    {house.bedrooms.map((bedroom) => (
                      <tr key={bedroom._id} className="text-stone-300">
                        <td className="px-2 py-3 font-medium text-stone-100">{bedroom.label}</td>
                        <td className="px-2 py-3 capitalize">{bedroom.type}</td>
                        <td className="px-2 py-3">{bedroom.beds}</td>
                        <td className="px-2 py-3">
                          <StatusPill status={bedroom.status} />
                        </td>
                        <td className="px-2 py-3 text-xs text-stone-500">
                          {bedroom.amenities.join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
