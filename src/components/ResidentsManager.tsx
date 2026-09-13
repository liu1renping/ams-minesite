"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, Panel, StatusPill } from "@/components/ui";
import { RESIDENT_ROLES, ROSTER_PATTERNS } from "@/lib/types";

export type ResidentRecord = {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  roster: string;
  phone: string;
  email: string;
  emergencyContact: string;
  active: boolean;
};

type FormState = {
  employeeId: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  roster: string;
  phone: string;
  email: string;
  emergencyContact: string;
  active: boolean;
};

const emptyForm: FormState = {
  employeeId: "",
  firstName: "",
  lastName: "",
  company: "",
  role: "operator",
  roster: "2/1",
  phone: "",
  email: "",
  emergencyContact: "",
  active: true,
};

function toForm(resident: ResidentRecord): FormState {
  return {
    employeeId: resident.employeeId,
    firstName: resident.firstName,
    lastName: resident.lastName,
    company: resident.company,
    role: resident.role,
    roster: resident.roster,
    phone: resident.phone ?? "",
    email: resident.email ?? "",
    emergencyContact: resident.emergencyContact ?? "",
    active: resident.active,
  };
}

const fieldClass =
  "rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100";

export function ResidentsManager({
  residents,
}: {
  residents: ResidentRecord[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const isEditing = editingId !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      [
        r.employeeId,
        r.firstName,
        r.lastName,
        r.company,
        r.role,
        r.phone,
        r.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [residents, query]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(resident: ResidentRecord) {
    setEditingId(resident._id);
    setForm(toForm(resident));
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
      ...form,
      employeeId: form.employeeId.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      company: form.company.trim(),
    };

    const res = await fetch(
      isEditing ? `/api/residents/${editingId}` : "/api/residents",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save resident");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete resident ${label}? This cannot be undone.`))
      return;

    setPending(true);
    setError(null);

    const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete resident");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Panel
        title={isEditing ? "Edit resident" : "Add resident"}
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
          <label className="grid gap-1 text-xs text-stone-400">
            Employee ID
            <input
              required
              value={form.employeeId}
              onChange={(e) => updateField("employeeId", e.target.value)}
              className={fieldClass}
              placeholder="EMP-1003"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            First name
            <input
              required
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Last name
            <input
              required
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Company
            <input
              required
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Role
            <select
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              className={fieldClass}
            >
              {RESIDENT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Roster
            <select
              value={form.roster}
              onChange={(e) => updateField("roster", e.target.value)}
              className={fieldClass}
            >
              {ROSTER_PATTERNS.map((roster) => (
                <option key={roster} value={roster}>
                  {roster}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Phone
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400 sm:col-span-2">
            Emergency contact
            <input
              value={form.emergencyContact}
              onChange={(e) => updateField("emergencyContact", e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm text-stone-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => updateField("active", e.target.checked)}
              className="rounded border-stone-600"
            />
            Active resident
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
              {pending ? "Saving…" : isEditing ? "Update resident" : "Add resident"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Residents & workforce"
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
          <EmptyState message="No residents match. Add one with the form." />
        ) : (
          <DataTable
            minWidthClass="min-w-[960px]"
            headers={[
              "Employee ID",
              "Name",
              "Company",
              "Role",
              "Roster",
              "Status",
              "Actions",
            ]}
          >
            {filtered.map((resident) => (
              <tr key={resident._id} className="text-stone-300">
                <td className="px-2 py-3 font-mono text-xs">{resident.employeeId}</td>
                <td className="px-2 py-3">
                  <div className="font-medium text-stone-100">
                    {resident.lastName}, {resident.firstName}
                  </div>
                  <div className="text-xs text-stone-500">
                    {resident.phone || resident.email || "—"}
                  </div>
                </td>
                <td className="px-2 py-3">{resident.company}</td>
                <td className="px-2 py-3 capitalize">{resident.role}</td>
                <td className="px-2 py-3 font-mono text-xs">{resident.roster}</td>
                <td className="px-2 py-3">
                  <StatusPill status={resident.active ? "active" : "inactive"} />
                </td>
                <td className="w-0 px-2 py-3 align-middle">
                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(resident)}
                      className="shrink-0 rounded-md bg-sky-700/70 px-2.5 py-1 text-xs text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        onDelete(
                          resident._id,
                          `${resident.lastName}, ${resident.firstName}`,
                        )
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
