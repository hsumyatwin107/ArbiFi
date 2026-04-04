import { isDisputeFinalized, type DisputeState } from "@/types/dispute";
import { card, label } from "./arbiStyles";

export function ProgressBlock({ state }: { state: DisputeState }) {
  const evidenceComplete = Boolean(state.evidenceA && state.evidenceB);
  const steps = [
    { n: 1, text: "Dispute created", done: state.disputeCreated },
    { n: 2, text: "Party B joined", done: state.partyBJoined },
    { n: 3, text: "Evidence submitted", done: evidenceComplete },
    { n: 4, text: "AI verdict generated", done: state.aiResult !== null },
    { n: 5, text: "Finalized", done: isDisputeFinalized(state) },
  ];

  return (
    <section className={card}>
      <h2 className={`${label} mb-4`}>Progress</h2>
      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                s.done
                  ? "bg-emerald-500/25 text-emerald-300"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {s.done ? "✓" : s.n}
            </span>
            <span className={s.done ? "text-zinc-200" : "text-zinc-500"}>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
