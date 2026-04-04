"use client";

import { Spinner } from "@/components/Spinner";
import { ArbiFiShell } from "@/components/dispute/ArbiFiShell";
import { ProgressBlock } from "@/components/dispute/ProgressBlock";
import { SettlementCard } from "@/components/dispute/SettlementCard";
import { VerdictReport } from "@/components/dispute/VerdictReport";
import { btnBase, card, label } from "@/components/dispute/arbiStyles";
import { useDispute } from "@/context/DisputeContext";
import {
  isDisputeFinalized,
  settlementChainSignature,
  settlementFundsText,
  verdictFromState,
} from "@/types/dispute";
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

const ADMIN_FOCUS =
  "This page: review both filings · run AI · finalize settlement";

export default function AdminPage() {
  const connection = useMemo(
    () => new Connection(DEVNET_RPC, "confirmed"),
    []
  );
  const { state, loading, error, runAi, finalize, setError } = useDispute();
  const [aiLoading, setAiLoading] = useState(false);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [phantomEnv, setPhantomEnv] = useState<
    "checking" | "ready" | "unavailable"
  >("checking");

  useEffect(() => {
    const gate = gatePhantom();
    if (!gate.ok) {
      setPhantomEnv("unavailable");
      return;
    }
    setPhantomEnv("ready");
    if (gate.phantom.publicKey) {
      setWalletAddress(gate.phantom.publicKey.toBase58());
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    const gate = gatePhantom();
    if (!gate.ok) {
      setError(userMessageForGate(gate.reason));
      return;
    }
    const { phantom } = gate;
    setWalletConnecting(true);
    try {
      if (walletAddress) {
        await phantom.disconnect();
        setWalletAddress(null);
        return;
      }
      const { publicKey } = await phantom.connect();
      setWalletAddress(publicKey.toBase58());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not connect to Phantom."
      );
    } finally {
      setWalletConnecting(false);
    }
  };

  const onRunAi = async () => {
    setError(null);
    setAiLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      await runAi();
    } catch {
      /* */
    } finally {
      setAiLoading(false);
    }
  };

  const onFinalize = async () => {
    if (!state?.aiResult || isDisputeFinalized(state)) return;
    setError(null);
    setFinalizeBusy(true);
    let chainSignature: string | undefined;
    if (walletAddress) {
      const gate = gatePhantom();
      if (gate.ok && gate.phantom.signAndSendTransaction) {
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
          const sent = await gate.phantom.signAndSendTransaction(
            tx,
            connection
          );
          chainSignature =
            typeof sent === "string" ? sent : sent.signature;
          await connection.confirmTransaction({
            signature: chainSignature,
            blockhash,
            lastValidBlockHeight,
          });
          console.log(PHANTOM_LOG, "Chain receipt:", chainSignature);
        } catch (e) {
          console.warn(PHANTOM_LOG, "Optional tx skipped:", e);
        }
      }
    }
    try {
      await finalize({ chainSignature });
    } catch {
      /* */
    } finally {
      setFinalizeBusy(false);
    }
  };

  if (loading || !state) {
    return (
      <ArbiFiShell title={ADMIN_FOCUS} active="admin">
        <p className="text-sm text-zinc-500">Loading dispute state…</p>
      </ArbiFiShell>
    );
  }

  const evidenceComplete = Boolean(state.evidenceA && state.evidenceB);
  const fin = isDisputeFinalized(state);
  const verdict = verdictFromState(state);
  const canRunAi =
    state.disputeCreated &&
    !fin &&
    evidenceComplete &&
    !verdict &&
    !aiLoading;
  const canFinalize = Boolean(verdict) && !fin && !finalizeBusy;

  return (
    <ArbiFiShell title={ADMIN_FOCUS} active="admin">
      <ProgressBlock state={state} />

      <section className={card}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className={label}>Wallet (optional)</h2>
            <p className="mt-1 text-xs text-zinc-600">
              Connect Phantom to record a 1-lamport devnet receipt on finalize.
            </p>
            <p className="mt-3 break-all font-mono text-sm text-zinc-200">
              {walletAddress ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void connectWallet()}
            disabled={walletConnecting}
            className={`${btnBase} shrink-0 bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-950/50`}
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
        {phantomEnv === "unavailable" ? (
          <p className="text-sm text-amber-200/85">
            {PHANTOM_UNAVAILABLE_BANNER}{" "}
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline"
            >
              phantom.app
            </a>
          </p>
        ) : null}
      </section>

      <section className={card}>
        <h2 className={`${label} mb-4`}>Evidence on file</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-violet-200/90">Party A</h3>
            <div className="mt-2 min-h-[100px] rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-400">
              {state.evidenceA || "—"}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-cyan-200/90">Party B</h3>
            <div className="mt-2 min-h-[100px] rounded-xl border border-white/[0.08] bg-black/35 px-3.5 py-3 text-sm text-zinc-400">
              {state.evidenceB || "—"}
            </div>
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={`${label} mb-4`}>Resolution</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canRunAi}
            onClick={() => void onRunAi()}
            className={`${btnBase} min-w-[10rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/40`}
          >
            {aiLoading ? (
              <>
                <Spinner className="h-4 w-4 text-white" />
                Running…
              </>
            ) : (
              "Run AI verdict"
            )}
          </button>
          <button
            type="button"
            disabled={!canFinalize}
            onClick={() => void onFinalize()}
            className={`${btnBase} border border-amber-500/35 bg-amber-500/[0.12] text-amber-100`}
          >
            {finalizeBusy ? (
              <>
                <Spinner className="h-4 w-4 text-amber-200" />
                Finalizing…
              </>
            ) : (
              "Finalize dispute"
            )}
          </button>
        </div>
      </section>

      <VerdictReport verdict={verdict} aiLoading={aiLoading} />

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
