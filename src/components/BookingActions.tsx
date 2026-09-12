"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function update(next: string) {
    setPending(true);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "reserved" ? (
        <button
          disabled={pending}
          onClick={() => update("checked_in")}
          className="rounded-md bg-emerald-600/80 px-2.5 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Check in
        </button>
      ) : null}
      {status === "checked_in" ? (
        <button
          disabled={pending}
          onClick={() => update("checked_out")}
          className="rounded-md bg-stone-600 px-2.5 py-1 text-xs text-white hover:bg-stone-500 disabled:opacity-50"
        >
          Check out
        </button>
      ) : null}
      {status === "reserved" ? (
        <button
          disabled={pending}
          onClick={() => update("cancelled")}
          className="rounded-md bg-rose-700/70 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
