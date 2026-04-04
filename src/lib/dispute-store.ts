import type { DisputeVerdict } from "@/lib/disputeAi";
import type { DisputeState } from "@/types/dispute";

/** In-memory hackathon store; resets on server restart. */
function initial(): DisputeState {
  return {
    disputeCreated: false,
    partyBJoined: false,
    evidenceA: "",
    evidenceB: "",
    aiResult: null,
    winner: "",
  };
}

let store: DisputeState = initial();

function clone(): DisputeState {
  return {
    ...store,
    aiResult: store.aiResult ? { ...store.aiResult } : null,
  };
}

export function getDisputeState(): DisputeState {
  return clone();
}

export type StoreResult =
  | { ok: true; state: DisputeState }
  | { ok: false; error: string };

function finalized(): boolean {
  return Boolean(store.aiResult?.finalized);
}

export function createDispute(): StoreResult {
  if (store.disputeCreated && !finalized()) {
    return { ok: false, error: "A dispute is already open." };
  }
  if (finalized()) {
    store = initial();
  }
  store.disputeCreated = true;
  return { ok: true, state: clone() };
}

export function joinDispute(): StoreResult {
  if (!store.disputeCreated) {
    return { ok: false, error: "No dispute to join yet." };
  }
  if (store.partyBJoined) {
    return { ok: false, error: "Already joined." };
  }
  if (finalized()) {
    return { ok: false, error: "Dispute is closed." };
  }
  store.partyBJoined = true;
  return { ok: true, state: clone() };
}

export function submitEvidenceA(text: string): StoreResult {
  const t = text.trim();
  if (!store.disputeCreated || finalized()) {
    return { ok: false, error: "Cannot submit evidence now." };
  }
  if (!t) {
    return { ok: false, error: "Evidence cannot be empty." };
  }
  store.evidenceA = t;
  return { ok: true, state: clone() };
}

export function submitEvidenceB(text: string): StoreResult {
  const t = text.trim();
  if (!store.disputeCreated || !store.partyBJoined || finalized()) {
    return { ok: false, error: "Cannot submit evidence now." };
  }
  if (!t) {
    return { ok: false, error: "Evidence cannot be empty." };
  }
  store.evidenceB = t;
  return { ok: true, state: clone() };
}

/**
 * Persists an AI verdict produced by the caller (e.g. /api/run-ai after analysis).
 * Does not run analysis itself — keeps inference isolated to the API layer.
 */
export function applyAiVerdictToStore(
  analyze: (evidenceA: string, evidenceB: string) => DisputeVerdict
): StoreResult {
  if (!store.disputeCreated || finalized()) {
    return { ok: false, error: "Cannot run AI now." };
  }
  if (!store.evidenceA || !store.evidenceB) {
    return {
      ok: false,
      error: "Both parties must submit evidence before running AI.",
    };
  }
  if (store.aiResult) {
    return {
      ok: false,
      error: "Verdict already exists. Finalize or start a new dispute.",
    };
  }
  const verdict = analyze(store.evidenceA, store.evidenceB);
  store.aiResult = { ...verdict };
  store.winner = verdict.winner;
  return { ok: true, state: clone() };
}

export function finalizeDispute(chainSignature?: string): StoreResult {
  if (!store.aiResult) {
    return { ok: false, error: "Generate an AI verdict first." };
  }
  if (store.aiResult.finalized) {
    return { ok: false, error: "Already finalized." };
  }
  const sig = chainSignature?.trim();
  store.aiResult = {
    ...store.aiResult,
    finalized: true,
    fundsSimulationText: `Funds sent to ${store.winner} (simulated escrow release — hackathon demo).`,
    chainSignature: sig && sig.length > 0 ? sig : null,
  };
  return { ok: true, state: clone() };
}
