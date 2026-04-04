/**
 * Minimal Phantom integration via window.solana (no wallet-adapter).
 * Console logs use a fixed prefix so you can filter in DevTools.
 */
const LOG = "[ArbiFi:Phantom]";

export type PhantomInjected = NonNullable<Window["solana"]>;

export type PhantomGate =
  | { ok: true; phantom: PhantomInjected }
  | { ok: false; reason: "no-extension" | "not-phantom" };

export const PHANTOM_HELP = {
  noExtension:
    "Phantom isn’t installed. Install it from phantom.app, refresh this page, then connect.",
  notPhantom:
    "This demo needs Phantom. Use a browser with the Phantom extension, or turn off other Solana wallets for this site.",
} as const;

/** Short hint under the wallet card when Phantom isn’t available */
export const PHANTOM_UNAVAILABLE_BANNER =
  "Phantom wasn’t detected, or another wallet is active in this tab. Install Phantom from phantom.app (or disable other Solana extensions), then refresh.";

/** Safe read of the injected provider (browser only). */
export function readWindowSolana(): Window["solana"] | undefined {
  if (typeof window === "undefined") return undefined;
  return window.solana;
}

/**
 * Ensures window.solana exists and is Phantom (solana.isPhantom === true).
 */
export function gatePhantom(): PhantomGate {
  const solana = readWindowSolana();
  if (!solana) {
    console.log(LOG, "window.solana is undefined — extension likely not installed");
    return { ok: false, reason: "no-extension" };
  }
  if (!solana.isPhantom) {
    console.log(LOG, "window.solana present but isPhantom is not true — need Phantom");
    return { ok: false, reason: "not-phantom" };
  }
  return { ok: true, phantom: solana };
}

export function userMessageForGate(
  reason: "no-extension" | "not-phantom"
): string {
  return reason === "no-extension"
    ? PHANTOM_HELP.noExtension
    : PHANTOM_HELP.notPhantom;
}

export { LOG as PHANTOM_LOG };
