import Image from "next/image";
import Link from "next/link";

const nav = [
  { href: "/apply", label: "Visitor Application" },
  { href: "/gm-approval", label: "GM Approval" },
  { href: "/allocation", label: "Allocation" },
  { href: "/properties", label: "Properties" },
];

export function AppShell({
  children,
  pathname = "/",
}: {
  children: React.ReactNode;
  pathname?: string;
}) {
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#1f2a24_0%,_#0f1412_55%,_#0b0f0d_100%)] text-stone-100">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 border-b border-emerald-900/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-amber-400/90 uppercase">
              Minesite Operations
            </p>
            <Link href="/apply" className="mt-2 inline-flex items-center gap-3">
              <Image
                src="/vms-icon.png"
                alt="VMS"
                width={48}
                height={48}
                priority
                className="h-12 w-12 rounded-xl shadow-[0_0_0_1px_rgba(245,158,11,0.25)]"
              />
              <h1 className="text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
                VMS
              </h1>
            </Link>
            <p className="mt-2 max-w-xl text-sm text-stone-400">
              Visitor Management System — visitors, approvals, and property allocations.
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
                      : "text-stone-400 hover:bg-white/5 hover:text-stone-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
