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
  camps,
  rooms,
  residents,
}: {
  camps: Array<{ _id: string; name: string }>;
  rooms: Array<{ _id: string; block: string; roomNumber: string; campId: string | { _id: string } }>;
  residents: Array<{ _id: string; firstName: string; lastName: string; employeeId: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campId, setCampId] = useState(camps[0]?._id ?? "");

  const today = new Date();
  const defaultCheckIn = toDateInputValue(today);
  const defaultCheckOut = toDateInputValue(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
  );

  const filteredRooms = rooms.filter((room) => {
    const id = typeof room.campId === "string" ? room.campId : room.campId?._id;
    return id === campId;
  });

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const payload = {
      campId: String(formData.get("campId")),
      roomId: String(formData.get("roomId")),
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

  if (!camps.length || !residents.length || !rooms.length) {
    return (
      <p className="text-sm text-stone-500">
        Seed sample data first (`npm run seed`) to create bookings.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs text-stone-400">
        Camp
        <select
          name="campId"
          value={campId}
          onChange={(e) => setCampId(e.target.value)}
          className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        >
          {camps.map((camp) => (
            <option key={camp._id} value={camp._id}>
              {camp.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs text-stone-400">
        Room
        <select
          name="roomId"
          required
          className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
        >
          {filteredRooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.block}-{room.roomNumber}
            </option>
          ))}
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
