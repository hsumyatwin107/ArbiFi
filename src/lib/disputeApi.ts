import type { DisputeState } from "@/types/dispute";

export type ApiPostResult =
  | { ok: true; state: DisputeState }
  | { ok: false; error: string };

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

const noStore = { cache: "no-store" as RequestCache };

/**
 * GET /api/dispute-state — current snapshot (shared across Party A / B / Admin).
 */
export async function fetchDisputeState(): Promise<DisputeState> {
  const r = await fetch("/api/dispute-state", noStore);
  if (!r.ok) {
    throw new Error(`Could not load dispute state (${r.status})`);
  }
  return r.json() as Promise<DisputeState>;
}

async function postJson(
  path: string,
  body: Record<string, unknown> = {}
): Promise<ApiPostResult> {
  const r = await fetch(`/api/${path}`, {
    method: "POST",
    headers: JSON_HEADERS,
    ...noStore,
    body: JSON.stringify(body),
  });
  return r.json() as Promise<ApiPostResult>;
}

export function postCreateDispute(): Promise<ApiPostResult> {
  return postJson("create-dispute");
}

export function postJoinDispute(): Promise<ApiPostResult> {
  return postJson("join-dispute");
}

export function postSubmitEvidenceA(text: string): Promise<ApiPostResult> {
  return postJson("submit-evidence-a", { text });
}

export function postSubmitEvidenceB(text: string): Promise<ApiPostResult> {
  return postJson("submit-evidence-b", { text });
}

export function postRunAi(): Promise<ApiPostResult> {
  return postJson("run-ai");
}

export function postFinalize(extra?: {
  chainSignature?: string;
}): Promise<ApiPostResult> {
  return postJson("finalize", extra ?? {});
}
