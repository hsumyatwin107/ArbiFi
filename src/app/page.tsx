"use client";

import { Spinner } from "@/components/Spinner";
import {
  type DisputeVerdict,
  resolveDisputeNlp,
} from "@/lib/disputeNlp";
import {
  PHANTOM_LOG,
  PHANTOM_UNAVAILABLE_BANNER,
  gatePhantom,
  userMessageForGate,
} from "@/lib/phantomWallet";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

const DEVNET_RPC = clusterApiUrl("devnet");

const card =
  "rounded-2xl border border-white/[0.07] bg-zinc-900/45 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]";

const label =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500";

export default function Home() {
  const connection = useMemo(
    () => new Connection(DEVNET_RPC, "confirmed"),
    []
  );

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [phantomEnv, setPhantomEnv] = useState<
    "checking" | "ready" | "unavailable"
  >("checking");

  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [evidenceA, setEvidenceA] = useState("");
  const [evidenceB, setEvidenceB] = useState("");
  const [disputeCreated, setDisputeCreated] = useState(false);
  const [aiResult, setAiResult] = useState<DisputeVerdict | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState<{
    text: string;
    signature: string;
  } | null>(null);

  useEffect(() => {
    const gate = gatePhantom();
    if (!gate.ok) {
      console.log(PHANTOM_LOG, "Startup: Phantom not usable —", gate.reason);
      setPhantomEnv("unavailable");
      return;
    }
    console.log(PHANTOM_LOG, "Startup: Phantom detected (isPhantom === true)");
    setPhantomEnv("ready");
    const { phantom } = gate;
    if (phantom.publicKey) {
      const addr = phantom.publicKey.toBase58();
      console.log(PHANTOM_LOG, "Startup: reusing authorized account", addr);
      setWalletAddress(addr);
    } else {
      console.log(
        PHANTOM_LOG,
        "Startup: Phantom installed; user has not approved this site yet"
      );
    }
  }, []);

  const connectWallet = async () => {
    setMessage(null);
    const gate = gatePhantom();
    if (!gate.ok) {
      console.log(PHANTOM_LOG, "Connect blocked:", gate.reason);
      setMessage(userMessageForGate(gate.reason));
      return;
    }
    const { phantom } = gate;

    setWalletConnecting(true);
    try {
      if (walletAddress) {
        console.log(PHANTOM_LOG, "Calling disconnect()…");
        await phantom.disconnect();
        setWalletAddress(null);
        console.log(PHANTOM_LOG, "Disconnected; cleared stored public key");
        return;
      }

      console.log(PHANTOM_LOG, "Calling connect()…");
      const { publicKey } = await phantom.connect();
      const addr = publicKey.toBase58();
      console.log(PHANTOM_LOG, "connect() resolved; public key:", addr);
      setWalletAddress(addr);
    } catch (e) {
      console.error(PHANTOM_LOG, "connect/disconnect error:", e);
      setMessage(
        e instanceof Error ? e.message : "Could not connect to Phantom."
      );
    } finally {
      setWalletConnecting(false);
    }
  };

  const createDispute = () => {
    setMessage(null);
    setFinalizeSuccess(null);
    setAiLoading(false);
    setDisputeCreated(true);
    setInputA("");
    setInputB("");
    setEvidenceA("");
    setEvidenceB("");
    setAiResult(null);
  };

  const submitEvidenceA = () => {
    setMessage(null);
    if (!disputeCreated) {
      setMessage("Create a dispute first.");
      return;
    }
    const t = inputA.trim();
    if (!t) {
      setMessage("Party A evidence cannot be empty.");
      return;
    }
    setEvidenceA(t);
  };

  const submitEvidenceB = () => {
    setMessage(null);
    if (!disputeCreated) {
      setMessage("Create a dispute first.");
      return;
    }
    const t = inputB.trim();
    if (!t) {
      setMessage("Party B evidence cannot be empty.");
      return;
    }
    setEvidenceB(t);
  };

  const runAi = async () => {
    setMessage(null);
    if (!disputeCreated) {
      setMessage("Create a dispute first.");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      await new Promise((r) => setTimeout(r, 650));
      const verdict = resolveDisputeNlp(evidenceA, evidenceB);
      console.log("[ArbiFi:AI]", JSON.stringify(verdict));
      setAiResult(verdict);
    } finally {
      setAiLoading(false);
    }
  };

  const finalizeDispute = async () => {
    setMessage(null);
    setFinalizeSuccess(null);
    if (!disputeCreated) {
      setMessage("No active dispute.");
      return;
    }
    if (!walletAddress) {
      setMessage("Connect Phantom to finalize.");
      return;
    }
    const gate = gatePhantom();
    if (!gate.ok) {
      console.log(PHANTOM_LOG, "Finalize blocked:", gate.reason);
      setMessage(userMessageForGate(gate.reason));
      return;
    }
    const { phantom } = gate;
    if (!phantom.signAndSendTransaction) {
      console.error(PHANTOM_LOG, "signAndSendTransaction not available");
      setMessage("Phantom cannot sign transactions in this environment.");
      return;
    }

    setFinalizeBusy(true);
    try {
      const pk = new PublicKey(walletAddress);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: pk,
          toPubkey: pk,
          lamports: 1,
        })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = pk;

      console.log(PHANTOM_LOG, "Requesting signAndSendTransaction (devnet)…");
      const sent = await phantom.signAndSendTransaction(tx, connection);
      const signature =
        typeof sent === "string" ? sent : sent.signature;
      console.log(PHANTOM_LOG, "Submitted; signature:", signature);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setDisputeCreated(false);
      setInputA("");
      setInputB("");
      setEvidenceA("");
      setEvidenceB("");
      setAiResult(null);
      setFinalizeSuccess({
        text: "Dispute finalized. Transfer of 1 lamport confirmed on devnet.",
        signature,
      });
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Transaction failed. Try again."
      );
    } finally {
      setFinalizeBusy(false);
    }
  };

  const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] disabled:pointer-events-none disabled:opacity-45";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060608] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-25%,rgba(139,92,246,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(34,211,238,0.07),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
        <header className="mb-12 text-center sm:mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
            <span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
              aria-hidden
            />
            Solana Devnet
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-tight">
            <span className="text-gradient-brand">ArbiFi</span>
            <span className="mt-1 block text-zinc-300 sm:mt-0 sm:inline sm:before:content-['·_'] sm:before:text-zinc-600">
              Dispute Resolver
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">
            Connect your wallet, submit party evidence, run resolution, and
            finalize with an on-chain transaction.
          </p>
        </header>

        <div className="flex flex-col gap-8">
          <section className={card}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className={label}>Wallet</h2>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      walletAddress
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        : "bg-zinc-600"
                    }`}
                    aria-hidden
                  />
                  <span className="text-sm text-zinc-400">
                    {walletAddress ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-3 break-all font-mono text-sm leading-relaxed text-zinc-200">
                  {walletAddress ?? "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void connectWallet()}
                disabled={walletConnecting}
                className={`${btnBase} shrink-0 bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-950/50 hover:from-violet-500 hover:to-violet-400`}
              >
                {walletConnecting ? (
                  <>
                    <Spinner className="h-4 w-4 text-white" />
                    Connecting
                  </>
                ) : walletAddress ? (
                  "Disconnect"
                ) : (
                  "Connect Phantom"
                )}
              </button>
            </div>
            {phantomEnv === "checking" ? (
              <p className="mt-4 text-xs text-zinc-600">
                Looking for Phantom in your browser…
              </p>
            ) : null}
            {phantomEnv === "unavailable" ? (
              <p className="mt-4 text-sm leading-relaxed text-amber-200/85">
                {PHANTOM_UNAVAILABLE_BANNER}{" "}
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-400 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-300"
                >
                  phantom.app
                </a>
              </p>
            ) : null}
          </section>

          <section className={card}>
            <h2 className={`${label} mb-6`}>Evidence</h2>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Party A
                  </label>
                  {evidenceA ? (
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400/90">
                      Stored · {evidenceA.length} chars
                    </span>
                  ) : null}
                </div>
                <textarea
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  rows={5}
                  placeholder="Position, facts, and claims…"
                  className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Party B
                  </label>
                  {evidenceB ? (
                    <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-400/90">
                      Stored · {evidenceB.length} chars
                    </span>
                  ) : null}
                </div>
                <textarea
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  rows={5}
                  placeholder="Position, facts, and claims…"
                  className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                />
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={`${label} mb-5`}>Actions</h2>
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-3 text-xs font-medium text-zinc-600">
                  Dispute
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={createDispute}
                    className={`${btnBase} border border-white/10 bg-white/[0.04] text-zinc-100 hover:border-white/15 hover:bg-white/[0.07]`}
                  >
                    Create Dispute
                  </button>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div>
                <p className="mb-3 text-xs font-medium text-zinc-600">
                  Evidence
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitEvidenceA}
                    className={`${btnBase} border border-violet-500/25 bg-violet-500/10 text-violet-100 hover:border-violet-400/35 hover:bg-violet-500/15`}
                  >
                    Submit Evidence A
                  </button>
                  <button
                    type="button"
                    onClick={submitEvidenceB}
                    className={`${btnBase} border border-cyan-500/25 bg-cyan-500/10 text-cyan-100 hover:border-cyan-400/35 hover:bg-cyan-500/15`}
                  >
                    Submit Evidence B
                  </button>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div>
                <p className="mb-3 text-xs font-medium text-zinc-600">
                  Resolution
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void runAi()}
                    disabled={aiLoading}
                    className={`${btnBase} min-w-[8.5rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/40 hover:from-violet-500 hover:to-fuchsia-500`}
                  >
                    {aiLoading ? (
                      <>
                        <Spinner className="h-4 w-4 text-white" />
                        Running…
                      </>
                    ) : (
                      "Run AI"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void finalizeDispute()}
                    disabled={finalizeBusy}
                    className={`${btnBase} border border-amber-500/35 bg-amber-500/[0.12] text-amber-100 hover:border-amber-400/45 hover:bg-amber-500/[0.18]`}
                  >
                    {finalizeBusy ? (
                      <>
                        <Spinner className="h-4 w-4 text-amber-200" />
                        Sending…
                      </>
                    ) : (
                      "Finalize Dispute"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-8 md:grid-cols-2 md:gap-6">
            <section className={card}>
              <h2 className={`${label} mb-4`}>Status</h2>
              <p
                className={`text-lg font-medium ${
                  disputeCreated ? "text-emerald-300/95" : "text-zinc-500"
                }`}
              >
                {disputeCreated ? "Dispute active" : "No active dispute"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                Create a dispute before submitting evidence or resolving.
              </p>
            </section>

            <section className={`${card} md:min-h-[200px]`}>
              <h2 className={`${label} mb-4`}>AI result</h2>
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <Spinner className="h-9 w-9 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      Analyzing evidence
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Comparing both parties…
                    </p>
                  </div>
                </div>
              ) : aiResult ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Winner
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                      Party {aiResult.winner}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Confidence
                    </p>
                    <p className="mt-1 font-mono text-lg text-violet-300/95">
                      {(aiResult.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {aiResult.reason}
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
                    {JSON.stringify(aiResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-zinc-600">
                  Run AI after you have the evidence you need. The outcome
                  appears here.
                </p>
              )}
            </section>
          </div>

          {finalizeSuccess && (
            <section
              className={`${card} border-emerald-500/20 bg-emerald-950/20 ring-emerald-500/10`}
              role="status"
            >
              <h2 className={`${label} mb-3 text-emerald-500/80`}>On-chain</h2>
              <p className="text-sm font-medium text-emerald-100/95">
                {finalizeSuccess.text}
              </p>
              <p className="mt-3 break-all font-mono text-xs leading-relaxed text-emerald-200/80">
                {finalizeSuccess.signature}
              </p>
              <a
                href={`https://solscan.io/tx/${finalizeSuccess.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-cyan-400/90 underline decoration-cyan-500/40 underline-offset-4 transition hover:text-cyan-300"
              >
                View on Solscan →
              </a>
            </section>
          )}

          {message && (
            <section
              className={`${card} border-red-500/25 bg-red-950/25 ring-red-500/10`}
              role="alert"
            >
              <h2 className={`${label} mb-2 text-red-400/90`}>Error</h2>
              <p className="text-sm text-red-100/90">{message}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
