import Link from "next/link";
import type { ReactNode } from "react";

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/[0.06]";

export function ArbiFiShell({
  title,
  active,
  children,
}: {
  title: string;
  active: "partyA" | "partyB" | "admin" | "home";
  children: ReactNode;
}) {
  const activeCls = "bg-white/[0.08] text-zinc-100 ring-1 ring-white/10";
  const idleCls = "text-zinc-500 hover:text-zinc-300";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060608] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-25%,rgba(139,92,246,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(34,211,238,0.07),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
        <header className="mb-10 border-b border-white/[0.06] pb-8 sm:mb-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="text-gradient-brand text-xl font-semibold tracking-tight"
            >
              ArbiFi
            </Link>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Shared state · API
            </p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            {title}
          </h1>
          <nav
            className="mt-6 flex flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1"
            aria-label="Role pages"
          >
            <Link
              href="/"
              className={`${navLink} ${active === "home" ? activeCls : idleCls}`}
            >
              Home
            </Link>
            <Link
              href="/partyA"
              className={`${navLink} ${active === "partyA" ? activeCls : idleCls}`}
            >
              Party A
            </Link>
            <Link
              href="/partyB"
              className={`${navLink} ${active === "partyB" ? activeCls : idleCls}`}
            >
              Party B
            </Link>
            <Link
              href="/admin"
              className={`${navLink} ${active === "admin" ? activeCls : idleCls}`}
            >
              Admin
            </Link>
          </nav>
        </header>

        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </main>
  );
}
