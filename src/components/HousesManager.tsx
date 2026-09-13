"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { HOUSE_STATUSES } from "@/lib/types";

export type HouseRecord = {
  _id: string;
  name: string;
  code: string;
  address: string;
  suburb: string;
  status: string;
  notes: string;
};

type FormState = {
  name: string;
  code: string;
  address: string;
  suburb: string;
  status: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  address: "",
  suburb: "",
  status: "active",
  notes: "",
};

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function HousesManager({ houses }: { houses: HouseRecord[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return houses;
    return houses.filter((h) =>
      [h.name, h.code, h.address, h.suburb, h.status, h.notes]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [houses, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(house: HouseRecord) {
    setEditingId(house._id);
    setForm({
      name: house.name,
      code: house.code,
      address: house.address,
      suburb: house.suburb,
      status: house.status,
      notes: house.notes ?? "",
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
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address.trim(),
      suburb: form.suburb.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    const res = await fetch(isEditing ? `/api/houses/${editingId}` : "/api/houses", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save house");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete house ${label}? This cannot be undone.`)) return;
    setPending(true);
    setError(null);

    const res = await fetch(`/api/houses/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete house");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit house" : "Add house"}
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
            Name
            <input required value={form.name} onChange={(e) => updateField("name", e.target.value)} className={fieldClass} placeholder="Riverbend House" />
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Code
            <input required value={form.code} onChange={(e) => updateField("code", e.target.value.toUpperCase())} className={fieldClass} placeholder="RB01" />
          </label>
          <label className="grid gap-1 text-xs text-stone-400">
            Status
            <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={fieldClass}>
              {HOUSE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Address
            <input required value={form.address} onChange={(e) => updateField("address", e.target.value)} className={fieldClass} placeholder="12 Mine Road" />
          </label>
          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Suburb / town
            <input required value={form.suburb} onChange={(e) => updateField("suburb", e.target.value)} className={fieldClass} placeholder="Newman, WA" />
          </label>
          <label className="grid gap-1 text-xs text-stone-400 sm:col-span-2 lg:col-span-4">
            Notes
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} className={fieldClass} />
          </label>
          {error ? <p className="text-sm text-rose-300 sm:col-span-2 lg:col-span-4">{error}</p> : null}
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={pending} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:opacity-60">
              {pending ? "Saving…" : isEditing ? "Update house" : "Add house"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Houses"
        action={
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-40 rounded-md border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-100 sm:w-52" />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState message="No houses match. Add one with the form." />
        ) : (
          <DataTable minWidthClass="min-w-[800px]" headers={["Name", "Code", "Address", "Status", "Actions"]}>
            {filtered.map((house) => (
              <tr key={house._id} className="text-stone-300">
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">{house.name}</div>
                  <div className="text-xs text-stone-500">{house.suburb}</div>
                </td>
                <td className="px-2 py-3 font-mono text-xs">{house.code}</td>
                <td className="px-2 py-3">{house.address}</td>
                <td className="px-2 py-3"><StatusPill status={house.status} /></td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button type="button" disabled={pending} onClick={() => startEdit(house)} className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50">Edit</button>
                    <button type="button" disabled={pending} onClick={() => onDelete(house._id, house.name)} className="shrink-0 rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50">Delete</button>
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
