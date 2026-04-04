import type { Connection, Transaction } from "@solana/web3.js";

export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey?: { toBase58(): string };
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
        publicKey: { toBase58(): string };
      }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (
        transaction: Transaction,
        connection?: Connection,
        options?: { skipPreflight?: boolean }
      ) => Promise<{ signature: string } | string>;
    };
  }
}
