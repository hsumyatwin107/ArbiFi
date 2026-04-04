/**
 * Server-side dispute analysis for /api/run-ai.
 * Rule-based signals; output is written as neutral arbitration-style prose.
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
  winner: "Party A" | "Party B";
  confidence: number;
  summary: string;
  reasoning: string;
  decision: string;
};

type WinnerCode = "A" | "B";
type KeywordCounts = { supportive: number; concerning: number; balance: number };

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

function assessEvidence(raw: string): KeywordCounts {
  const lower = raw.trim().toLowerCase();
  if (!lower) return { supportive: 0, concerning: 0, balance: 0 };

  const { count: concerning, masked } = maskAndCount(lower, NEGATIVE);
  const { count: supportive } = maskAndCount(masked, POSITIVE);
  return {
    supportive,
    concerning,
    balance: supportive - concerning,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function preview(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function partyLabel(code: WinnerCode): "Party A" | "Party B" {
  return code === "A" ? "Party A" : "Party B";
}

function extractThemeClauses(raw: string): string[] {
  const lower = raw.toLowerCase();
  const out: string[] = [];
  const add = (c: string) => {
    if (!out.includes(c)) out.push(c);
  };

  if (lower.includes("not received") || lower.includes("not delivered")) {
    add("goods or services were not received or did not arrive as agreed");
  } else if (lower.includes("delivered")) {
    add("delivery or handover occurred");
  }
  if (lower.includes("late") || lower.includes("delay")) {
    add("timeliness or delay is material to their position");
  }
  if (lower.includes("payment") || lower.includes("paid")) {
    add("payment obligations figure prominently");
  }
  if (lower.includes("completed") || lower.includes("finished")) {
    add("they characterize the work or commitment as complete");
  }
  if (lower.includes("failed") || lower.includes("failure")) {
    add("they describe a failure or breakdown in performance");
  }
  return out;
}

function joinThatClauses(clauses: string[]): string {
  const parts = clauses.map((c) => `that ${c}`);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}, and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function filingTone(name: string, supportive: number, concerning: number): string {
  if (supportive === 0 && concerning === 0) {
    return `The tone of ${name}'s submission is measured and does not strongly favor either satisfaction or complaint.`;
  }
  if (supportive > concerning && supportive > 0) {
    return `On balance, ${name}'s language suggests the matter was concluded satisfactorily or is being framed in constructive terms.`;
  }
  if (concerning > supportive && concerning > 0) {
    return `On balance, ${name}'s language emphasizes dissatisfaction, concern, or unresolved issues.`;
  }
  if (supportive > 0 && concerning > 0) {
    return `${name} combines affirmative statements with criticism, yielding a mixed rather than one-sided presentation.`;
  }
  if (supportive > 0) {
    return `Overall, ${name}'s account reads as more satisfied than aggrieved.`;
  }
  return `Overall, ${name}'s account reads as more aggrieved than satisfied.`;
}

function partyReasoningParagraph(
  name: "Party A" | "Party B",
  verb: "asserts" | "contends",
  text: string,
  counts: KeywordCounts
): string {
  const clauses = extractThemeClauses(text);
  const pv = preview(text);
  const tone = filingTone(name, counts.supportive, counts.concerning);

  if (clauses.length === 0) {
    return `${name} ${verb} their position principally through narrative description. Excerpt: "${pv}" ${tone}`;
  }
  return `${name} ${verb} ${joinThatClauses(clauses)}. Representative language includes: "${pv}" ${tone}`;
}

function pickWinnerCode(a: KeywordCounts, b: KeywordCounts): WinnerCode {
  if (a.balance > b.balance) return "A";
  if (b.balance > a.balance) return "B";
  if (a.supportive > b.supportive) return "A";
  if (b.supportive > a.supportive) return "B";
  return "A";
}

function confidenceFrom(
  a: KeywordCounts,
  b: KeywordCounts,
  perfectTie: boolean,
  netTieBrokenBySupport: boolean
): number {
  if (perfectTie) return 0.5;
  if (netTieBrokenBySupport) return 0.55;
  const spread = Math.abs(a.balance - b.balance);
  return Math.round(clamp01(0.52 + spread * 0.14) * 100) / 100;
}

/**
 * Analyze both submissions and produce a structured, human-readable determination.
 * Intended to be invoked only from the server (e.g. POST /api/run-ai).
 */
export function analyzeDisputeEvidence(
  evidenceA: string,
  evidenceB: string
): DisputeVerdict {
  const ta = evidenceA.trim();
  const tb = evidenceB.trim();

  if (!ta && !tb) {
    return {
      winner: "Party A",
      confidence: 0,
      summary:
        "No substantive written evidence has been filed by either party. Without materials to review, comparative analysis cannot proceed.",
      reasoning:
        "The docket contains no party statements. Party A has not placed a narrative on the record; Party B has likewise not filed. Consequently, there are no competing accounts to weigh, no themes to extract, and no basis for a merits-based preference.",
      decision:
        "No determination on the substance is possible. Party A is indicated solely as a procedural placeholder so the matter may remain system-addressable; this designation must not be interpreted as a finding in their favor.",
    };
  }

  if (ta && !tb) {
    const a = assessEvidence(ta);
    const clauses = extractThemeClauses(ta);
    const pv = preview(ta);
    const themePart =
      clauses.length > 0
        ? `Party A maintains ${joinThatClauses(clauses)}. `
        : "";
    return {
      winner: "Party A",
      confidence: 0.75,
      summary:
        "The record includes a written submission from Party A only. Party B has not filed a corresponding statement within this record, yielding a one-sided evidentiary posture.",
      reasoning: `Upon review, only Party A has offered a documented account. ${themePart}Representative excerpt: "${pv}" ${filingTone("Party A", a.supportive, a.concerning)} Party B has not yet advanced a written position here; therefore, no direct rebuttal appears on the face of the file.`,
      decision:
        "In light of the asymmetry of the record, Party A's submission stands unrebutted for purposes of this interim review. Party B retains the ability to file a responsive statement should the process remain open.",
    };
  }

  if (!ta && tb) {
    const b = assessEvidence(tb);
    const clauses = extractThemeClauses(tb);
    const pv = preview(tb);
    const themePart =
      clauses.length > 0
        ? `Party B maintains ${joinThatClauses(clauses)}. `
        : "";
    return {
      winner: "Party B",
      confidence: 0.75,
      summary:
        "The record includes a written submission from Party B only. Party A has not filed a corresponding statement within this record, yielding a one-sided evidentiary posture.",
      reasoning: `Upon review, only Party B has offered a documented account. Party A has not yet advanced a written position here. ${themePart}Representative excerpt: "${pv}" ${filingTone("Party B", b.supportive, b.concerning)} No direct rebuttal from Party A appears on the face of the file.`,
      decision:
        "In light of the asymmetry of the record, Party B's submission stands unrebutted for purposes of this interim review. Party A retains the ability to file a responsive statement should the process remain open.",
    };
  }

  const a = assessEvidence(ta);
  const b = assessEvidence(tb);
  const winnerCode = pickWinnerCode(a, b);
  const winner = partyLabel(winnerCode);
  const loser = partyLabel(winnerCode === "A" ? "B" : "A");

  const perfectTie =
    a.balance === b.balance &&
    a.supportive === b.supportive &&
    a.concerning === b.concerning;
  const netTieBrokenBySupport =
    !perfectTie &&
    a.balance === b.balance &&
    a.supportive !== b.supportive;

  const confidence = confidenceFrom(
    a,
    b,
    perfectTie,
    netTieBrokenBySupport
  );

  const hasSignals =
    a.supportive + a.concerning + b.supportive + b.concerning > 0;
  const summary = hasSignals
    ? "The record contains competing narratives concerning the same underlying dispute. Each party emphasizes different facts as to performance, timing, and whether obligations were satisfied."
    : "Both parties have filed written statements. The language is in places neutral; the assessment therefore relies on subtle differences in how each party frames responsibility and closure.";

  const comparativeCore =
    a.balance > b.balance
      ? "Party A's account comparatively aligns more closely with a narrative of orderly completion, whereas Party B's submission places greater weight on friction or open issues."
      : b.balance > a.balance
        ? "Party B's account comparatively aligns more closely with a narrative of orderly completion, whereas Party A's submission places greater weight on friction or open issues."
        : "Neither submission clearly dominates on the dimensions reviewed; each blends affirmative and critical elements in comparable proportion.";

  const reasoning = `The following analysis is based solely on the text of the parties' submissions as presented on the record.

${partyReasoningParagraph("Party A", "asserts", ta, a)}

${partyReasoningParagraph("Party B", "contends", tb, b)}

${comparativeCore} This comparison informs the disposition set out below.`;

  let decision: string;
  if (perfectTie) {
    decision = `The submissions are evenly balanced under the rubric applied. In the absence of a decisive lean, ${winner} is designated as a procedural default to allow administrative closure; this is not a strong merits determination. Either party may supplement the record if additional material becomes available.`;
  } else if (netTieBrokenBySupport) {
    decision = `The parties' overall posture is closely matched; however, ${winner}'s language places modestly greater emphasis on fulfilled obligations and resolution. On that narrow basis, ${winner} is preferred to ${loser}. The margin is slight, and both filings are entitled to appropriate consideration.`;
  } else {
    decision = `For the purposes of this review, ${winner}'s account is more consistent with a narrative of performance having been carried through and material obligations addressed. ${loser}'s concerns are acknowledged but do not, on this record, outweigh the weight ${winner} assigns to completion and follow-through. Accordingly, ${winner} is the preferred outcome.`;
  }

  return {
    winner,
    confidence,
    summary,
    reasoning: reasoning.trim(),
    decision,
  };
}
