import { submitEvidenceB } from "@/lib/dispute-store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string };
    const result = await submitEvidenceB(
      typeof body.text === "string" ? body.text : ""
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
