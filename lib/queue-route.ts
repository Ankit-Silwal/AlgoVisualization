import { NextResponse } from "next/server";
import { runSchema } from "./runner";
import { currentUser, allowRate } from "./auth";
import { db } from "./db";
import { hasSameOrigin } from "./request-origin";
export async function POST(request: Request) {
  if (process.env.RUNNER_ENABLED !== "true")
    return NextResponse.json(
      {
        error:
          "Execution is disabled. Build the runner, set RUNNER_ENABLED=true, and start npm run worker.",
      },
      { status: 503 },
    );
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const user = await currentUser(request);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to run code. Your programs and results stay in your account." },
        { status: 401 },
      );
    const raw = await request.text();
    if (raw.length > 240000)
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const parsed = runSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid code, language, input, or timing settings." },
        { status: 400 },
      );
    const worker = await db.workerHeartbeat.findFirst({
      where: { seenAt: { gt: new Date(Date.now() - 15000) } },
    });
    if (!worker)
      return NextResponse.json(
        { error: "No execution worker is online. Start npm run worker on your runner host." },
        { status: 503 },
      );
    if (
      !(await allowRate(`runs:${user.id}`, 240, 600000)) ||
      !(await allowRate(`runs-day:${user.id}`, 2000, 86400000))
    )
      return NextResponse.json(
        { error: "Execution quota reached. Try again after the current quota window." },
        { status: 429 },
      );
    const job = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;
      const pending = await tx.executionJob.count({
        where: { userId: user.id, status: { in: ["QUEUED", "RUNNING"] } },
      });
      if (pending >= 4) throw new Error("QUEUE_LIMIT");
      return tx.executionJob.create({ data: { userId: user.id, payload: parsed.data } });
    });
    return NextResponse.json({ id: job.id, status: job.status }, { status: 202 });
  } catch (e) {
    if (e instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    if ((e as Error).message === "QUEUE_LIMIT")
      return NextResponse.json(
        { error: "You already have four pending jobs. Wait for one to finish." },
        { status: 429 },
      );
    return NextResponse.json(
      { error: "The execution queue is unavailable. Check PostgreSQL and the worker." },
      { status: 503 },
    );
  }
}
