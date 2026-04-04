import { analyzeDisputeEvidence } from "@/lib/disputeAi";
import { applyAiVerdictToStore } from "@/lib/dispute-store";
import { verdictFromState } from "@/types/dispute";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await applyAiVerdictToStore(analyzeDisputeEvidence);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 }
    );
  }

  const verdict = verdictFromState(result.state);
  return NextResponse.json({
    ok: true,
    state: result.state,
    analysis: verdict
      ? {
          summary: verdict.summary,
          reasoning: verdict.reasoning,
          decision: verdict.decision,
          winner: verdict.winner,
          confidence: verdict.confidence,
        }
      : null,
  });
}
