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

const PARTY_A_FOCUS = "This page: open the case · submit Evidence A";

export default function PartyAPage() {
  const { state, loading, error, createDispute, submitEvidenceA } =
    useDispute();
  const [inputA, setInputA] = useState("");
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      await createDispute();
    } catch {
      /* error set in hook */
    } finally {
      setBusy(false);
    }
  };

  const onSubmitA = async () => {
    setBusy(true);
    try {
      await submitEvidenceA(inputA);
      setInputA("");
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  if (loading || !state) {
    return (
      <ArbiFiShell title={PARTY_A_FOCUS} active="partyA">
        <p className="text-sm text-zinc-500">Loading dispute state…</p>
      </ArbiFiShell>
    );
  }

  const fin = isDisputeFinalized(state);
  const canCreate = !state.disputeCreated || fin;
  const canSubmitA =
    state.disputeCreated && !fin && inputA.trim().length > 0;

  return (
    <ArbiFiShell title={PARTY_A_FOCUS} active="partyA">
      <ProgressBlock state={state} />

      <section className={card}>
        <h2 className={`${label} mb-4`}>Actions</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Open a new file or submit your written account for the record.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={!canCreate || busy}
            onClick={() => void onCreate()}
            className={`${btnBase} border border-white/10 bg-white/[0.04] text-zinc-100 hover:border-white/15 hover:bg-white/[0.07]`}
          >
            {fin ? "Start new dispute" : "Create dispute"}
          </button>
        </div>
      </section>

      <section className={card}>
        <h2 className={`${label} mb-4`}>Your evidence</h2>
        <textarea
          value={inputA}
          onChange={(e) => setInputA(e.target.value)}
          disabled={!state.disputeCreated || fin}
          rows={6}
          placeholder={
            state.disputeCreated
              ? "Describe your position…"
              : "Create a dispute first…"
          }
          className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/25 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!canSubmitA || busy}
          onClick={() => void onSubmitA()}
          className={`${btnBase} mt-3 border border-violet-500/25 bg-violet-500/10 text-violet-100 hover:border-violet-400/35 hover:bg-violet-500/15`}
        >
          Submit evidence A
        </button>
        {state.evidenceA ? (
          <p className="mt-3 text-xs text-emerald-400/90">
            On file: {state.evidenceA.length} characters
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
