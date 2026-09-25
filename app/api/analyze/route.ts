import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeCode } from "@/lib/algorithms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 40000) return NextResponse.json({ error: "Code must be under 30,000 characters." }, { status: 413 });
    const parsed = z.object({ code: z.string().trim().min(1).max(30000), name: z.string().max(60), language: z.string().max(30) }).safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: "Provide code, a name up to 60 characters, and a language." }, { status: 400 });
    return NextResponse.json(analyzeCode(parsed.data.code, parsed.data.name, parsed.data.language));
  } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
}
