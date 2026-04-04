"use client";

import type { DisputeState } from "@/types/dispute";
import * as disputeApi from "@/lib/disputeApi";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DisputeContextValue = {
  /** Server-backed dispute snapshot; same instance for /partyA, /partyB, /admin. */
  state: DisputeState | null;
  loading: boolean;
  error: string | null;
  setError: (message: string | null) => void;
  refresh: () => Promise<void>;
  createDispute: () => Promise<DisputeState>;
  joinDispute: () => Promise<DisputeState>;
  submitEvidenceA: (text: string) => Promise<DisputeState>;
  submitEvidenceB: (text: string) => Promise<DisputeState>;
  runAi: () => Promise<DisputeState>;
  finalize: (extra?: { chainSignature?: string }) => Promise<DisputeState>;
};

const DisputeContext = createContext<DisputeContextValue | null>(null);

const POLL_MS = 4000;

export function DisputeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DisputeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await disputeApi.fetchDisputeState();
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dispute state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const id = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const applyPost = useCallback(
    async (call: () => Promise<disputeApi.ApiPostResult>) => {
      setError(null);
      let result: disputeApi.ApiPostResult;
      try {
        result = await call();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setError(msg);
        throw e;
      }
      if (!result.ok) {
        setError(result.error);
        throw new Error(result.error);
      }
      setState(result.state);
      return result.state;
    },
    []
  );

  const createDispute = useCallback(
    () => applyPost(() => disputeApi.postCreateDispute()),
    [applyPost]
  );
  const joinDispute = useCallback(
    () => applyPost(() => disputeApi.postJoinDispute()),
    [applyPost]
  );
  const submitEvidenceA = useCallback(
    (text: string) =>
      applyPost(() => disputeApi.postSubmitEvidenceA(text)),
    [applyPost]
  );
  const submitEvidenceB = useCallback(
    (text: string) =>
      applyPost(() => disputeApi.postSubmitEvidenceB(text)),
    [applyPost]
  );
  const runAi = useCallback(
    () => applyPost(() => disputeApi.postRunAi()),
    [applyPost]
  );
  const finalize = useCallback(
    (extra?: { chainSignature?: string }) =>
      applyPost(() => disputeApi.postFinalize(extra)),
    [applyPost]
  );

  const value = useMemo(
    () => ({
      state,
      loading,
      error,
      setError,
      refresh,
      createDispute,
      joinDispute,
      submitEvidenceA,
      submitEvidenceB,
      runAi,
      finalize,
    }),
    [
      state,
      loading,
      error,
      refresh,
      createDispute,
      joinDispute,
      submitEvidenceA,
      submitEvidenceB,
      runAi,
      finalize,
    ]
  );

  return (
    <DisputeContext.Provider value={value}>{children}</DisputeContext.Provider>
  );
}

export function useDispute() {
  const ctx = useContext(DisputeContext);
  if (!ctx) {
    throw new Error("useDispute must be used within DisputeProvider");
  }
  return ctx;
}
