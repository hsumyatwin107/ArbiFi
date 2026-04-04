import { getDisputeState } from "@/lib/dispute-store";
import { NextResponse } from "next/server";

/** Read current snapshot (needed for page load; not part of the six POST actions). */
export async function GET() {
  return NextResponse.json(getDisputeState());
}
