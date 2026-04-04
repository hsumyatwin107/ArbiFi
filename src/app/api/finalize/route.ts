import { finalizeDispute, getDisputeState } from "@/lib/dispute-store";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEVNET = clusterApiUrl("devnet");

/** Best-effort devnet lookup for a client-submitted Phantom receipt. */
async function receiptFoundOnDevnet(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    return tx !== null;
  } catch {
    return false;
  }
}

/**
 * Unsigned 1-lamport transfer layout for demo only (shows a minimal Solana transaction shape).
 */
async function buildDemoTransferBase64(
  connection: Connection
): Promise<string | null> {
  try {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const escrow = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrow,
        toPubkey: recipient,
        lamports: 1,
      })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = escrow;
    const raw = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    return Buffer.from(raw).toString("base64");
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { chainSignature?: string };
    const chainSignature =
      typeof body.chainSignature === "string"
        ? body.chainSignature.trim()
        : undefined;

    const snapshot = getDisputeState();
    if (!snapshot.aiResult) {
      return NextResponse.json(
        { ok: false, error: "Generate an AI verdict first." },
        { status: 400 }
      );
    }
    if (snapshot.aiResult.finalized) {
      return NextResponse.json(
        { ok: false, error: "Already finalized." },
        { status: 400 }
      );
    }

    const winner = snapshot.winner || snapshot.aiResult.winner;
    const connection = new Connection(DEVNET, "confirmed");

    let receiptFoundOnDevnetFlag: boolean | undefined;
    if (chainSignature) {
      receiptFoundOnDevnetFlag = await receiptFoundOnDevnet(
        connection,
        chainSignature
      );
    }

    const demoUnsignedTransferBase64 = await buildDemoTransferBase64(connection);

    let fundsSimulationText = `Simulated settlement: notional escrow released to ${winner} per the determination (demo only — no custodial funds moved).`;
    if (chainSignature) {
      fundsSimulationText += receiptFoundOnDevnetFlag
        ? " Optional devnet transaction receipt was found and linked to this finalization."
        : " A chain signature was provided; devnet verification did not return a matching transaction (demo — finalization still recorded).";
    } else {
      fundsSimulationText +=
        " No on-chain receipt was supplied; see `solana.demoUnsignedTransferBase64` for an illustrative unsigned transfer layout.";
    }

    const result = finalizeDispute({
      chainSignature,
      fundsSimulationText,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    const successMessage = `Finalization complete. Simulated funds allocated to ${winner}.`;

    return NextResponse.json({
      ok: true,
      success: true,
      message: successMessage,
      winner,
      state: result.state,
      solana: {
        ...(chainSignature
          ? {
              chainSignature,
              receiptFoundOnDevnet: receiptFoundOnDevnetFlag,
            }
          : {}),
        ...(demoUnsignedTransferBase64
          ? { demoUnsignedTransferBase64 }
          : {}),
        cluster: "devnet",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }
}
