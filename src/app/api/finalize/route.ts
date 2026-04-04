import { finalizeDispute } from "@/lib/dispute-store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { chainSignature?: string };
    const result = finalizeDispute(
      typeof body.chainSignature === "string"
        ? body.chainSignature
        : undefined
    );
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, state: result.state });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }
}
