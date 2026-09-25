import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasSameOrigin } from "@/lib/request-origin";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(id))
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    const job = await db.executionJob.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        status: true,
        result: true,
        error: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
    });
    return job
      ? NextResponse.json(job, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.json({ error: "Job not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Queue unavailable." }, { status: 503 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const user = await currentUser(request);
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(id))
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    const result = await db.executionJob.updateMany({
      where: { id, userId: user.id, status: { in: ["QUEUED", "RUNNING"] } },
      data: { status: "CANCELLED", finishedAt: new Date() },
    });
    return NextResponse.json({ cancelled: result.count > 0 });
  } catch {
    return NextResponse.json({ error: "Could not cancel job." }, { status: 503 });
  }
}
