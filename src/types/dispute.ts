import type { DisputeVerdict } from "@/lib/disputeAi";

/** Extra fields merged into `aiResult` after finalize (hackathon demo). */
export type AiResultMeta = {
  finalized?: boolean;
  fundsSimulationText?: string | null;
  chainSignature?: string | null;
};

export type AiResult = DisputeVerdict & AiResultMeta;

/** Serializable snapshot from persistence / API. */
export type DisputeState = {
  disputeCreated: boolean;
  partyBJoined: boolean;
  evidenceA: string;
  evidenceB: string;
  aiResult: AiResult | null;
  winner: string;
};

export function isDisputeFinalized(s: DisputeState): boolean {
  return Boolean(s.aiResult?.finalized);
}

/** Core verdict fields for UI (strips settlement meta from `aiResult`). */
export function verdictFromState(s: DisputeState): DisputeVerdict | null {
  if (!s.aiResult) return null;
  const r = s.aiResult;
  return {
    winner: r.winner,
    confidence: r.confidence,
    summary: r.summary,
    reasoning: r.reasoning,
    decision: r.decision,
  };
}

export function settlementFundsText(s: DisputeState): string | null {
  return s.aiResult?.fundsSimulationText ?? null;
}

export function settlementChainSignature(s: DisputeState): string | null {
  return s.aiResult?.chainSignature ?? null;
}
