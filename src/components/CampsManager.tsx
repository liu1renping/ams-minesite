"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { CAMP_STATUSES } from "@/lib/types";

export type CampRecord = {
  _id: string;
  name: string;
  code: string;
  siteName: string;
  location: string;
  capacity: number;
  status: string;
  notes: string;
};

type FormState = {
  name: string;
  code: string;
  siteName: string;
  location: string;
  capacity: string;
  status: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  siteName: "",
  location: "",
  capacity: "",
  status: "active",
  notes: "",
};

function toForm(camp: CampRecord): FormState {
  return {
    name: camp.name,
    code: camp.code,
    siteName: camp.siteName,
    location: camp.location,
    capacity: String(camp.capacity),
    status: camp.status,
    notes: camp.notes ?? "",
  };
}

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function CampsManager({ camps }: { camps: CampRecord[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return camps;
    return camps.filter((c) =>
      [c.name, c.code, c.siteName, c.location, c.status, c.notes]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [camps, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(camp: CampRecord) {
    setEditingId(camp._id);
    setForm(toForm(camp));
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
      siteName: form.siteName.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      status: form.status,
      notes: form.notes.trim(),
    };

    const res = await fetch(
      isEditing ? `/api/camps/${editingId}` : "/api/camps",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save camp");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete camp ${label}? This cannot be undone.`)) return;

    setPending(true);
    setError(null);

    const res = await fetch(`/api/camps/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete camp");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit camp" : "Add camp"}
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
            Name
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={fieldClass}
              placeholder="Main Village"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Code
            <input
              required
              value={form.code}
              onChange={(e) => updateField("code", e.target.value.toUpperCase())}
              className={fieldClass}
              placeholder="MV01"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Capacity
            <input
              required
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => updateField("capacity", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Site name
            <input
              required
              value={form.siteName}
              onChange={(e) => updateField("siteName", e.target.value)}
              className={fieldClass}
              placeholder="Iron Ridge Mine"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-2">
            Location
            <input
              required
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              className={fieldClass}
              placeholder="Pilbara, WA"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className={fieldClass}
            >
              {CAMP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400 lg:col-span-3">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              className={fieldClass}
            />
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
              {pending ? "Saving…" : isEditing ? "Update camp" : "Add camp"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Camps & villages"
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
          <EmptyState message="No camps match. Add one with the form." />
        ) : (
          <DataTable
            minWidthClass="min-w-[800px]"
            headers={["Name", "Code", "Site", "Capacity", "Status", "Actions"]}
          >
            {filtered.map((camp) => (
              <tr key={camp._id} className="text-stone-300">
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">{camp.name}</div>
                  <div className="text-xs text-stone-500">{camp.location}</div>
                </td>
                <td className="px-2 py-3 font-mono text-xs">{camp.code}</td>
                <td className="px-2 py-3">{camp.siteName}</td>
                <td className="px-2 py-3">{camp.capacity}</td>
                <td className="px-2 py-3">
                  <StatusPill status={camp.status} />
                </td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(camp)}
                      className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDelete(camp._id, camp.name)}
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
