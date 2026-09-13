"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function QuickBookingForm({
  houses,
  bedrooms,
  residents,
}: {
  houses: Array<{ _id: string; name: string }>;
  bedrooms: Array<{
    _id: string;
    label: string;
    houseId: string | { _id: string };
  }>;
  residents: Array<{ _id: string; firstName: string; lastName: string; employeeId: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [houseId, setHouseId] = useState(houses[0]?._id ?? "");

  const today = new Date();
  const defaultCheckIn = toDateInputValue(today);
  const defaultCheckOut = toDateInputValue(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
  );

  const filteredBedrooms = bedrooms.filter((bedroom) => {
    const id = typeof bedroom.houseId === "string" ? bedroom.houseId : bedroom.houseId?._id;
    return id === houseId;
  });

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const payload = {
      houseId: String(formData.get("houseId")),
      bedroomId: String(formData.get("bedroomId")),
      residentId: String(formData.get("residentId")),
      checkIn: String(formData.get("checkIn")),
      checkOut: String(formData.get("checkOut")),
      status: "reserved",
      purpose: "roster",
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create booking");
      return;
    }

    router.refresh();
  }

  if (!houses.length || !residents.length) {
    return (
      <p className="text-sm text-stone-500">
        Seed sample data first (`npm run seed`) to create bookings.
      </p>
    );
  }

  if (!bedrooms.length) {
    return (
      <p className="text-sm text-stone-500">
        No available bedrooms to book. Free a bedroom or add one on the Bedrooms page.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs text-stone-400">
        House
        <select
          name="houseId"
          value={houseId}
          onChange={(e) => setHouseId(e.target.value)}
          className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        >
          {houses.map((house) => (
            <option key={house._id} value={house._id}>
              {house.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs text-stone-400">
        Bedroom
        <select
          name="bedroomId"
          required
          className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        >
          {filteredBedrooms.length === 0 ? (
            <option value="" disabled>
              No available bedrooms in this house
            </option>
          ) : (
            filteredBedrooms.map((bedroom) => (
              <option key={bedroom._id} value={bedroom._id}>
                {bedroom.label}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="grid gap-1 text-xs text-stone-400 sm:col-span-2">
        Resident
        <select
          name="residentId"
          required
          className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        >
          {residents.map((r) => (
            <option key={r._id} value={r._id}>
              {r.lastName}, {r.firstName} ({r.employeeId})
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs text-stone-400">
        Check-in
        <input
          type="date"
          name="checkIn"
          required
          defaultValue={defaultCheckIn}
          className="date-input rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        />
      </label>

      <label className="grid gap-1 text-xs text-stone-400">
        Check-out
        <input
          type="date"
          name="checkOut"
          required
          defaultValue={defaultCheckOut}
          min={defaultCheckIn}
          className="date-input rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        />
      </label>

      {error ? <p className="text-sm text-rose-300 sm:col-span-2">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-amber-400 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Saving…" : "Create booking"}
      </button>
    </form>
  );
}
