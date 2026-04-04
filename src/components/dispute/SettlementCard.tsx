import { card, label } from "./arbiStyles";

export function SettlementCard({
  fundsText,
  chainSignature,
}: {
  fundsText: string | null;
  chainSignature: string | null;
}) {
  if (!fundsText) return null;

  return (
    <section
      className={`${card} border-emerald-500/20 bg-emerald-950/20 ring-emerald-500/10`}
      role="status"
    >
      <h2 className={`${label} mb-2 text-emerald-500/80`}>
        Settlement (simulated)
      </h2>
      <p className="text-base font-medium text-emerald-100">{fundsText}</p>
      {chainSignature ? (
        <>
          <p className="mt-4 text-xs text-zinc-500">
            Optional on-chain receipt (devnet)
          </p>
          <p className="mt-1 break-all font-mono text-xs text-emerald-200/80">
            {chainSignature}
          </p>
          <a
            href={`https://solscan.io/tx/${chainSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-sm text-cyan-400 underline decoration-cyan-500/40 underline-offset-4 hover:text-cyan-300"
          >
            Solscan →
          </a>
        </>
      ) : null}
    </section>
  );
}
