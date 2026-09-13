"use client";

import { useState } from "react";
import { DEPARTMENTS, VISIT_REASONS } from "@/lib/types";

type TravellerForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  photoIdFileName: string;
};

const emptyTraveller = (): TravellerForm => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  photoIdFileName: "",
});

const fieldClass =
  "w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600";

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-stone-700/80 px-4 pb-4 pt-2">
      <legend className="px-2 text-sm font-medium text-stone-300">{legend}</legend>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function VisitorApplicationForm() {
  const [travellers, setTravellers] = useState<TravellerForm[]>([emptyTraveller()]);
  const [hostName, setHostName] = useState("");
  const [hostTitle, setHostTitle] = useState("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [reason, setReason] = useState<string>(VISIT_REASONS[0]);
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState("yes");
  const [carRego, setCarRego] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateTraveller(index: number, key: keyof TravellerForm, value: string) {
    setTravellers((prev) =>
      prev.map((traveller, i) => (i === index ? { ...traveller, [key]: value } : traveller)),
    );
  }

  function addTraveller() {
    setTravellers((prev) => [...prev, emptyTraveller()]);
  }

  function removeTraveller(index: number) {
    setTravellers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const payload = {
      applicationType: travellers.length > 1 ? "group" : "single",
      travellers,
      hostName,
      hostTitle,
      department,
      reason,
      arrival,
      departure,
      accommodationRequired: accommodationRequired === "yes",
      carRego,
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit application");
      return;
    }

    setSuccess("Application submitted successfully.");
    setTravellers([emptyTraveller()]);
    setHostName("");
    setHostTitle("");
    setDepartment(DEPARTMENTS[0]);
    setReason(VISIT_REASONS[0]);
    setArrival("");
    setDeparture("");
    setAccommodationRequired("yes");
    setCarRego("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          Visitor Application
        </h2>
        <p className="text-sm text-stone-400">
          Submit one visitor or add more travellers for a group visit.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-emerald-900/50 bg-stone-950/40 p-5 sm:p-6"
      >
        {travellers.map((traveller, index) => (
          <Fieldset key={index} legend={`Traveller ${index + 1}`}>
            <label className="grid gap-1 text-xs text-stone-400">
              Visitor Name
              <input
                required
                value={traveller.name}
                onChange={(e) => updateTraveller(index, "name", e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-xs text-stone-400">
              Email
              <input
                required
                type="email"
                value={traveller.email}
                onChange={(e) => updateTraveller(index, "email", e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-xs text-stone-400">
              Phone
              <input
                value={traveller.phone}
                onChange={(e) => updateTraveller(index, "phone", e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-xs text-stone-400">
              Company
              <input
                required
                value={traveller.company}
                onChange={(e) => updateTraveller(index, "company", e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-xs text-stone-400 sm:col-span-2">
              Photo ID
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  updateTraveller(
                    index,
                    "photoIdFileName",
                    e.target.files?.[0]?.name ?? "",
                  )
                }
                className="block w-full text-sm text-stone-400 file:mr-3 file:rounded-md file:border-0 file:bg-stone-800 file:px-3 file:py-2 file:text-sm file:text-stone-100 hover:file:bg-stone-700"
              />
              {traveller.photoIdFileName ? (
                <span className="text-[11px] text-stone-500">
                  Selected: {traveller.photoIdFileName}
                </span>
              ) : null}
            </label>

            {travellers.length > 1 ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => removeTraveller(index)}
                  className="text-xs text-rose-300 hover:text-rose-200"
                >
                  Remove traveller
                </button>
              </div>
            ) : null}
          </Fieldset>
        ))}

        <button
          type="button"
          onClick={addTraveller}
          className="text-sm text-amber-300 hover:text-amber-200"
        >
          + Add another traveller
        </button>

        <Fieldset legend="Visit Details">
          <label className="grid gap-1 text-xs text-stone-400">
            Host Name
            <input
              required
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Host Title
            <input
              value={hostTitle}
              onChange={(e) => setHostTitle(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Site Superintendent"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Department
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
            >
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={fieldClass}
            >
              {VISIT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Arrival
            <input
              required
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className={`${fieldClass} date-input`}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Departure
            <input
              required
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className={`${fieldClass} date-input`}
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Accommodation Required
            <select
              value={accommodationRequired}
              onChange={(e) => setAccommodationRequired(e.target.value)}
              className={fieldClass}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-400">
            Car Rego
            <input
              value={carRego}
              onChange={(e) => setCarRego(e.target.value)}
              className={fieldClass}
              placeholder="Optional"
            />
          </label>
        </Fieldset>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
