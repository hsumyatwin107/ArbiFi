import type { DisputeVerdict } from "@/lib/disputeAi";
import { prisma } from "@/lib/prisma";
import type { AiResult, DisputeState } from "@/types/dispute";
import { isDisputeFinalized } from "@/types/dispute";
import { Prisma } from "@prisma/client";

const SINGLETON_ID = "default";

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

function clone(state: DisputeState): DisputeState {
  return {
    ...state,
    aiResult: state.aiResult ? { ...state.aiResult } : null,
  };
}

function rowToState(row: {
  disputeCreated: boolean;
  partyBJoined: boolean;
  evidenceA: string;
  evidenceB: string;
  aiResult: Prisma.JsonValue;
  winner: string;
}): DisputeState {
  return {
    disputeCreated: row.disputeCreated,
    partyBJoined: row.partyBJoined,
    evidenceA: row.evidenceA,
    evidenceB: row.evidenceB,
    aiResult:
      row.aiResult === null || row.aiResult === undefined
        ? null
        : (row.aiResult as unknown as AiResult),
    winner: row.winner,
  };
}

async function ensureRow() {
  return prisma.disputeState.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      disputeCreated: false,
      partyBJoined: false,
      evidenceA: "",
      evidenceB: "",
      winner: "",
    },
    update: {},
  });
}

async function persist(state: DisputeState): Promise<void> {
  await prisma.disputeState.update({
    where: { id: SINGLETON_ID },
    data: {
      disputeCreated: state.disputeCreated,
      partyBJoined: state.partyBJoined,
      evidenceA: state.evidenceA,
      evidenceB: state.evidenceB,
      aiResult:
        state.aiResult === null
          ? Prisma.JsonNull
          : (JSON.parse(JSON.stringify(state.aiResult)) as Prisma.InputJsonValue),
      winner: state.winner,
    },
  });
}

export async function getDisputeState(): Promise<DisputeState> {
  const row = await ensureRow();
  return clone(rowToState(row));
}

export type StoreResult =
  | { ok: true; state: DisputeState }
  | { ok: false; error: string };

export async function createDispute(): Promise<StoreResult> {
  const row = await ensureRow();
  let store = rowToState(row);

  if (store.disputeCreated && !isDisputeFinalized(store)) {
    return { ok: false, error: "A dispute is already open." };
  }
  if (isDisputeFinalized(store)) {
    store = initial();
  }
  store.disputeCreated = true;
  await persist(store);
  return { ok: true, state: clone(store) };
}

export async function joinDispute(): Promise<StoreResult> {
  const row = await ensureRow();
  const store = rowToState(row);

  if (!store.disputeCreated) {
    return { ok: false, error: "No dispute to join yet." };
  }
  if (store.partyBJoined) {
    return { ok: false, error: "Already joined." };
  }
  if (isDisputeFinalized(store)) {
    return { ok: false, error: "Dispute is closed." };
  }
  store.partyBJoined = true;
  await persist(store);
  return { ok: true, state: clone(store) };
}

export async function submitEvidenceA(text: string): Promise<StoreResult> {
  const row = await ensureRow();
  const store = rowToState(row);
  const t = text.trim();

  if (!store.disputeCreated || isDisputeFinalized(store)) {
    return { ok: false, error: "Cannot submit evidence now." };
  }
  if (!t) {
    return { ok: false, error: "Evidence cannot be empty." };
  }
  store.evidenceA = t;
  await persist(store);
  return { ok: true, state: clone(store) };
}

export async function submitEvidenceB(text: string): Promise<StoreResult> {
  const row = await ensureRow();
  const store = rowToState(row);
  const t = text.trim();

  if (!store.disputeCreated || !store.partyBJoined || isDisputeFinalized(store)) {
    return { ok: false, error: "Cannot submit evidence now." };
  }
  if (!t) {
    return { ok: false, error: "Evidence cannot be empty." };
  }
  store.evidenceB = t;
  await persist(store);
  return { ok: true, state: clone(store) };
}

export async function applyAiVerdictToStore(
  analyze: (evidenceA: string, evidenceB: string) => DisputeVerdict
): Promise<StoreResult> {
  const row = await ensureRow();
  const store = rowToState(row);

  if (!store.disputeCreated || isDisputeFinalized(store)) {
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
  await persist(store);
  return { ok: true, state: clone(store) };
}

export async function finalizeDispute(opts?: {
  chainSignature?: string;
  fundsSimulationText?: string;
}): Promise<StoreResult> {
  const row = await ensureRow();
  const store = rowToState(row);

  if (!store.aiResult) {
    return { ok: false, error: "Generate an AI verdict first." };
  }
  if (store.aiResult.finalized) {
    return { ok: false, error: "Already finalized." };
  }
  const sig = opts?.chainSignature?.trim();
  const fundsSimulationText =
    opts?.fundsSimulationText?.trim() ||
    `Funds sent to ${store.winner} (simulated escrow release — hackathon demo).`;
  store.aiResult = {
    ...store.aiResult,
    finalized: true,
    fundsSimulationText,
    chainSignature: sig && sig.length > 0 ? sig : null,
  };
  await persist(store);
  return { ok: true, state: clone(store) };
}
