import { createDispute } from "@/lib/dispute-store";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await createDispute();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, state: result.state });
}
