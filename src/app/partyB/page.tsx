"use client";

import { ArbiFiShell } from "@/components/dispute/ArbiFiShell";
import { ProgressBlock } from "@/components/dispute/ProgressBlock";
import { SettlementCard } from "@/components/dispute/SettlementCard";
import { VerdictReport } from "@/components/dispute/VerdictReport";
import { btnBase, card, label } from "@/components/dispute/arbiStyles";
import {
  isDisputeFinalized,
  settlementChainSignature,
  settlementFundsText,
  verdictFromState,
} from "@/types/dispute";
import { useDispute } from "@/context/DisputeContext";
import { useState } from "react";

export default function PartyBPage() {
  const { state, loading, error, joinDispute, submitEvidenceB } = useDispute();
  const [inputB, setInputB] = useState("");
  const [busy, setBusy] = useState(false);

  const onJoin = async () => {
    setBusy(true);
    try {
      await joinDispute();
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  const onSubmitB = async () => {
    setBusy(true);
    try {
      await submitEvidenceB(inputB);
      setInputB("");
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  if (loading || !state) {
    return (
      <ArbiFiShell title="Party B" active="partyB">
        <p className="text-sm text-zinc-500">Loading dispute state…</p>
      </ArbiFiShell>
    );
  }

  const fin = isDisputeFinalized(state);
  const canJoin =
    state.disputeCreated && !state.partyBJoined && !fin;
  const canSubmitB =
    state.disputeCreated &&
    state.partyBJoined &&
    !fin &&
    inputB.trim().length > 0;

  return (
    <ArbiFiShell title="Party B" active="partyB">
      <ProgressBlock state={state} />

      <section className={card}>
        <h2 className={`${label} mb-4`}>Join dispute</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Confirm you are participating before filing your statement.
        </p>
        <button
          type="button"
          disabled={!canJoin || busy}
          onClick={() => void onJoin()}
          className={`${btnBase} border border-cyan-500/25 bg-cyan-500/10 text-cyan-100 hover:border-cyan-400/35 hover:bg-cyan-500/15`}
        >
          {state.partyBJoined ? "Already joined" : "Join dispute"}
        </button>
      </section>

      <section className={card}>
        <h2 className={`${label} mb-4`}>Your evidence</h2>
        <textarea
          value={inputB}
          onChange={(e) => setInputB(e.target.value)}
          disabled={
            !state.disputeCreated || !state.partyBJoined || fin
          }
          rows={6}
          placeholder={
            !state.disputeCreated
              ? "Wait for Party A to create a dispute…"
              : !state.partyBJoined
                ? "Join the dispute first…"
                : "Describe your position…"
          }
          className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!canSubmitB || busy}
          onClick={() => void onSubmitB()}
          className={`${btnBase} mt-3 border border-cyan-500/25 bg-cyan-500/10 text-cyan-100 hover:border-cyan-400/35 hover:bg-cyan-500/15`}
        >
          Submit evidence B
        </button>
        {state.evidenceB ? (
          <p className="mt-3 text-xs text-emerald-400/90">
            On file: {state.evidenceB.length} characters
          </p>
        ) : null}
      </section>

      <VerdictReport
        verdict={verdictFromState(state)}
        aiLoading={false}
        emptyMessage="The official report appears here after the admin runs AI."
      />

      <SettlementCard
        fundsText={settlementFundsText(state)}
        chainSignature={settlementChainSignature(state)}
      />

      {error ? (
        <section
          className={`${card} border-red-500/25 bg-red-950/25 ring-red-500/10`}
          role="alert"
        >
          <h2 className={`${label} mb-2 text-red-400/90`}>Notice</h2>
          <p className="text-sm text-red-100/90">{error}</p>
        </section>
      ) : null}
    </ArbiFiShell>
  );
}
