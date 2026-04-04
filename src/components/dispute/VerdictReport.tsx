import { Spinner } from "@/components/Spinner";
import type { DisputeVerdict } from "@/lib/disputeAi";
import { card } from "./arbiStyles";

export function VerdictReport({
  verdict,
  aiLoading,
  emptyMessage = "Run AI once both evidences are on file.",
}: {
  verdict: DisputeVerdict | null;
  aiLoading: boolean;
  emptyMessage?: string;
}) {
  return (
    <section
      className={`${card} border-zinc-700/50 bg-[#0c0c0e]/90`}
      aria-labelledby="verdict-report-title"
    >
      <header className="mb-8 border-b-2 border-zinc-600/50 pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          ArbiFi · dispute resolution
        </p>
        <h2
          id="verdict-report-title"
          className="mt-2 font-serif text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl"
        >
          Official finding and report
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm leading-relaxed text-zinc-500">
          This document summarizes the matter on file. It is produced for
          demonstration purposes only.
        </p>
      </header>

      {aiLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Spinner className="h-9 w-9 text-zinc-400" />
          <p className="font-serif text-sm text-zinc-500">
            Reviewing submissions…
          </p>
        </div>
      ) : verdict ? (
        <div className="space-y-5 font-serif">
          <div className="rounded-xl border-2 border-amber-500/45 bg-gradient-to-b from-amber-950/35 via-zinc-950/50 to-zinc-950/80 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-amber-200/85">
              Winner
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {verdict.winner}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-amber-500/20 pt-4 font-sans text-xs text-zinc-400">
              <span>
                Assessment confidence:{" "}
                <span className="font-mono text-sm font-semibold text-amber-100/95">
                  {(verdict.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-600/40 bg-zinc-950/50 p-5 shadow-sm">
            <h3 className="border-b border-zinc-600/40 pb-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              Summary
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-200">
              {verdict.summary}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-600/40 bg-zinc-950/50 p-5 shadow-sm">
            <h3 className="border-b border-zinc-600/40 pb-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              Reasoning
            </h3>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.7] text-zinc-300">
              {verdict.reasoning}
            </p>
          </div>

          <div className="rounded-xl border-2 border-zinc-200/25 bg-zinc-100/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2 border-b-2 border-zinc-500/40 pb-3">
              <span
                className="flex h-2 w-2 shrink-0 rounded-full bg-red-500/90 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                aria-hidden
              />
              <h3 className="font-sans text-sm font-extrabold uppercase tracking-[0.2em] text-zinc-100">
                Final decision
              </h3>
            </div>
            <p className="mt-5 text-base font-bold leading-[1.75] text-white sm:text-lg">
              {verdict.decision}
            </p>
          </div>
        </div>
      ) : (
        <p className="font-serif text-sm text-zinc-600">{emptyMessage}</p>
      )}
    </section>
  );
}
