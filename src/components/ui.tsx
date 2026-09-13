export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-900/50 bg-stone-950/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-xs font-medium tracking-wide text-stone-400 uppercase">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold text-stone-50">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-emerald-900/50 bg-stone-950/40">
      <div className="flex items-center justify-between border-b border-emerald-900/40 px-5 py-4">
        <h2 className="text-sm font-medium tracking-wide text-stone-200 uppercase">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    occupied: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    maintenance: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
    out_of_service: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    inactive: "bg-stone-500/15 text-stone-300 ring-stone-500/30",
    commissioning: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    reserved: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    checked_in: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    checked_out: "bg-stone-500/15 text-stone-300 ring-stone-500/30",
    cancelled: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ring-1 ${
        tones[status] ?? "bg-stone-500/15 text-stone-300 ring-stone-500/30"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-700/80 px-4 py-10 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}

export function DataTable({
  headers,
  children,
  minWidthClass = "min-w-[720px]",
}: {
  headers: string[];
  children: React.ReactNode;
  minWidthClass?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidthClass} table-auto text-left text-sm`}>
        <thead>
          <tr className="border-b border-emerald-900/40 text-xs tracking-wide text-stone-500 uppercase">
            {headers.map((header) => (
              <th
                key={header}
                className={`px-2 py-3 font-medium ${
                  header === "Actions" ? "w-0 whitespace-nowrap" : ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-950/80">{children}</tbody>
      </table>
    </div>
  );
}
