import Link from "next/link";
import { ArbiFiShell } from "@/components/dispute/ArbiFiShell";
import { card, label } from "@/components/dispute/arbiStyles";

const portalCard =
  "group block rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 shadow-xl shadow-black/40 transition hover:border-violet-500/30 hover:bg-zinc-900/60";

export default function HomePage() {
  return (
    <ArbiFiShell title="Dispute portal" active="home">
      <p className="text-sm leading-relaxed text-zinc-500">
        This desk behaves like three different users on one live case: Party A,
        Party B, and a neutral administrator. Use the workspace switcher above,
        the role buttons below, or open each route in its own browser window so
        sessions feel independent. State is shared through the API and resets
        when the server restarts.
      </p>

      <section className={card}>
        <h2 className={`${label} mb-4`}>Choose a role</h2>
        <ul className="flex flex-col gap-3">
          <li>
            <Link href="/partyA" className={portalCard}>
              <span className="text-lg font-semibold text-zinc-100 group-hover:text-violet-200">
                Party A
              </span>
              <p className="mt-1 text-sm text-zinc-500">
                Create the dispute · Submit evidence A
              </p>
            </Link>
          </li>
          <li>
            <Link href="/partyB" className={portalCard}>
              <span className="text-lg font-semibold text-zinc-100 group-hover:text-cyan-200">
                Party B
              </span>
              <p className="mt-1 text-sm text-zinc-500">
                Join the dispute · Submit evidence B
              </p>
            </Link>
          </li>
          <li>
            <Link href="/admin" className={portalCard}>
              <span className="text-lg font-semibold text-zinc-100 group-hover:text-amber-200">
                Admin
              </span>
              <p className="mt-1 text-sm text-zinc-500">
                Review both filings · Run AI · Finalize
              </p>
            </Link>
          </li>
        </ul>
      </section>
    </ArbiFiShell>
  );
}
