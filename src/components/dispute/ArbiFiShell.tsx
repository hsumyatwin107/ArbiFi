import Link from "next/link";
import type { ReactNode } from "react";

const navPill =
  "inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-semibold transition sm:min-h-0 sm:flex-none sm:px-4";

type ActiveNav = "partyA" | "partyB" | "admin" | "home";

const ROLE_CONFIG: Record<
  Exclude<ActiveNav, "home">,
  {
    short: string;
    badge: string;
    headline: string;
    detail: string;
    accentBorder: string;
    accentBg: string;
    accentRing: string;
    navActive: string;
  }
> = {
  partyA: {
    short: "Party A",
    badge: "Claimant",
    headline: "Party A · Claimant workspace",
    detail:
      "You open the dispute and file the first evidence. Other participants use their own tab or device — everyone shares the same live case on the server.",
    accentBorder: "border-violet-500/80",
    accentBg: "bg-violet-950/35",
    accentRing: "ring-violet-500/20",
    navActive:
      "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/35 shadow-[0_0_24px_-8px_rgba(139,92,246,0.5)]",
  },
  partyB: {
    short: "Party B",
    badge: "Respondent",
    headline: "Party B · Respondent workspace",
    detail:
      "You join an existing dispute and submit your evidence. Keep this window separate from Party A or Admin to mimic real parties with their own sessions.",
    accentBorder: "border-cyan-500/75",
    accentBg: "bg-cyan-950/30",
    accentRing: "ring-cyan-500/20",
    navActive:
      "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35 shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]",
  },
  admin: {
    short: "Admin",
    badge: "Arbiter",
    headline: "Administrator · Neutral arbiter",
    detail:
      "Read both filings, run the AI review, and finalize settlement. This role should stay independent from Party A and Party B — use another tab or machine in demos.",
    accentBorder: "border-amber-500/70",
    accentBg: "bg-amber-950/25",
    accentRing: "ring-amber-500/20",
    navActive:
      "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30 shadow-[0_0_24px_-8px_rgba(245,158,11,0.25)]",
  },
};

const navIdleCls =
  "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200";

export function ArbiFiShell({
  title,
  active,
  children,
}: {
  title: string;
  active: ActiveNav;
  children: ReactNode;
}) {
  const role = active !== "home" ? ROLE_CONFIG[active] : null;

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
        <header className="mb-8 border-b border-white/[0.06] pb-8 sm:mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/"
                className="text-gradient-brand inline-block text-xl font-semibold tracking-tight"
              >
                ArbiFi
              </Link>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                Multi-user dispute desk · one shared case via the API. Use
                separate tabs, browsers, or devices so each role feels like its
                own session.
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-zinc-200"
            >
              Portal home
            </Link>
          </div>

          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Switch workspace
            </p>
            <nav
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
              aria-label="Switch between Party A, Party B, and Admin"
            >
              <div className="flex w-full gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1 sm:w-auto">
                <Link
                  href="/partyA"
                  aria-current={active === "partyA" ? "page" : undefined}
                  className={`${navPill} ${
                    active === "partyA"
                      ? ROLE_CONFIG.partyA.navActive
                      : navIdleCls
                  }`}
                >
                  Party A
                </Link>
                <Link
                  href="/partyB"
                  aria-current={active === "partyB" ? "page" : undefined}
                  className={`${navPill} ${
                    active === "partyB"
                      ? ROLE_CONFIG.partyB.navActive
                      : navIdleCls
                  }`}
                >
                  Party B
                </Link>
                <Link
                  href="/admin"
                  aria-current={active === "admin" ? "page" : undefined}
                  className={`${navPill} ${
                    active === "admin"
                      ? ROLE_CONFIG.admin.navActive
                      : navIdleCls
                  }`}
                >
                  Admin
                </Link>
              </div>
            </nav>
          </div>

          {role ? (
            <div
              className={`mt-8 rounded-2xl border border-white/[0.08] ${role.accentBg} p-5 ring-1 ring-inset ${role.accentRing} sm:p-6`}
            >
              <div
                className={`mb-4 inline-flex items-center gap-2 border-b-2 ${role.accentBorder} pb-3`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Current role
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 ring-1 ${role.accentRing}`}
                >
                  {role.badge}
                </span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
                {role.headline}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {role.detail}
              </p>
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  This screen
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-300">
                  {title}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Pick a workspace below or use the switcher to jump between
                roles.
              </p>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-8">{children}</div>

        <footer className="mt-16 border-t border-white/[0.06] pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Jump to another role
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/partyA"
              className="inline-flex items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/[0.08] px-4 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-500/15"
            >
              Party A workspace
            </Link>
            <Link
              href="/partyB"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-500/15"
            >
              Party B workspace
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-400/35 hover:bg-amber-500/15"
            >
              Admin console
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
