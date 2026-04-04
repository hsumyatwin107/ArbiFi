"use client";

import { DisputeProvider } from "@/context/DisputeContext";
import type { ReactNode } from "react";

export function DisputeProviders({ children }: { children: ReactNode }) {
  return <DisputeProvider>{children}</DisputeProvider>;
}
