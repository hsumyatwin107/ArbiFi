/**
 * Hackathon-style keyword scoring for two-party evidence (no real NLP).
 */

const POSITIVE = [
  "completed",
  "delivered",
  "on time",
  "paid",
  "finished",
] as const;

const NEGATIVE = [
  "late",
  "not delivered",
  "missing",
  "scam",
  "delay",
  "failed",
] as const;

export type DisputeVerdict = {
  winner: "A" | "B";
  confidence: number;
  reason: string;
};

type KeywordCounts = { positive: number; negative: number; net: number };

/** Longest phrases first so e.g. "not delivered" wins over "delivered". */
function maskAndCount(text: string, phrases: readonly string[]): {
  count: number;
  masked: string;
} {
  let masked = text.toLowerCase();
  let count = 0;
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const p = phrase.toLowerCase();
    let i = 0;
    while ((i = masked.indexOf(p, i)) !== -1) {
      count++;
      masked =
        masked.slice(0, i) + " ".repeat(p.length) + masked.slice(i + p.length);
      i += p.length;
    }
  }
  return { count, masked };
}

function scoreEvidence(raw: string): KeywordCounts {
  const lower = raw.trim().toLowerCase();
  if (!lower) return { positive: 0, negative: 0, net: 0 };

  const { count: negative, masked } = maskAndCount(lower, NEGATIVE);
  const { count: positive } = maskAndCount(masked, POSITIVE);
  return {
    positive,
    negative,
    net: positive - negative,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Returns a simple verdict object (also easy to JSON.stringify for demos).
 */
export function resolveDisputeNlp(
  evidenceA: string,
  evidenceB: string
): DisputeVerdict {
  const ta = evidenceA.trim();
  const tb = evidenceB.trim();

  if (!ta && !tb) {
    return {
      winner: "A",
      confidence: 0,
      reason: "No evidence from either party — no basis to prefer A or B.",
    };
  }

  if (ta && !tb) {
    return {
      winner: "A",
      confidence: 0.75,
      reason: "Only Party A submitted evidence.",
    };
  }

  if (!ta && tb) {
    return {
      winner: "B",
      confidence: 0.75,
      reason: "Only Party B submitted evidence.",
    };
  }

  const a = scoreEvidence(ta);
  const b = scoreEvidence(tb);

  let winner: "A" | "B";
  if (a.net > b.net) winner = "A";
  else if (b.net > a.net) winner = "B";
  else if (a.positive > b.positive) winner = "A";
  else if (b.positive > a.positive) winner = "B";
  else winner = "A";

  const spread = Math.abs(a.net - b.net);
  let confidence: number;
  let tieNote = "";
  if (a.net === b.net && a.positive === b.positive && a.negative === b.negative) {
    confidence = 0.5;
    tieNote = " Perfect keyword tie; winner defaults to A.";
  } else if (a.net === b.net) {
    confidence = 0.55;
    tieNote = " Same net score; tie-break uses who had more positive keyword hits.";
  } else {
    confidence = clamp01(0.52 + spread * 0.14);
  }

  const reason = `Keyword score: A net ${a.net} (${a.positive}+ / ${a.negative}−) vs B net ${b.net} (${b.positive}+ / ${b.negative}−). Party ${winner} wins.${tieNote}`;

  return {
    winner,
    confidence: Math.round(confidence * 100) / 100,
    reason,
  };
}
