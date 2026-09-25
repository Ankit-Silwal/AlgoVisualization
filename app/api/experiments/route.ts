import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { experimentSchema } from "@/lib/schema";
import { currentUser, allowRate } from "@/lib/auth";
import { hasSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to view your saved experiments." },
        { status: 401 },
      );
    const result = await db.experiment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error:
          "PostgreSQL is unavailable. Set DATABASE_URL and start your database. You can still compare algorithms and export your work.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 5000000)
      return NextResponse.json({ error: "Experiment is too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = experimentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid experiment.", details: parsed.error.flatten() },
      { status: 400 },
    );
  try {
    const user = await currentUser(request);
    if (!user)
      return NextResponse.json({ error: "Sign in to save your experiment." }, { status: 401 });
    if (!(await allowRate(`save:${user.id}`, 100, 3600000)))
      return NextResponse.json({ error: "Save limit reached. Try again later." }, { status: 429 });
    const saved = await db.experiment.create({
      data: { name: parsed.data.name, data: parsed.data, userId: user.id },
    });
    return NextResponse.json({ id: saved.id, name: saved.name }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save to PostgreSQL. Check DATABASE_URL and database connectivity. Export JSON to keep a copy.",
      },
      { status: 503 },
    );
  }
}
