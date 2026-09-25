import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { db } from "../lib/db";
import { runProgram, runSchema } from "../lib/runner";
const workerId = randomUUID(),
  active = new Map<string, AbortController>();
let stopping = false,
  lastCleanup = 0;
if (process.env.NODE_ENV === "production" && process.env.RUNNER_RUNTIME !== "runsc") {
  console.error(
    "Production execution requires RUNNER_RUNTIME=runsc on a dedicated gVisor runner host.",
  );
  process.exit(1);
}
async function processJob(id: string, payload: unknown) {
  const controller = new AbortController();
  active.set(id, controller);
  const monitor = setInterval(async () => {
    try {
      const job = await db.executionJob.findUnique({ where: { id }, select: { status: true } });
      if (!job || job.status === "CANCELLED") controller.abort();
    } catch {
      controller.abort();
    }
  }, 500);
  try {
    const parsed = runSchema.parse(payload);
    const result = await runProgram(parsed, { id, signal: controller.signal });
    await db.executionJob.updateMany({
      where: { id, status: "RUNNING" },
      data: { status: "SUCCEEDED", result, finishedAt: new Date() },
    });
  } catch (e) {
    await db.executionJob
      .updateMany({
        where: { id, status: "RUNNING" },
        data: {
          status: "FAILED",
          error: (e as Error).message.slice(0, 1000),
          finishedAt: new Date(),
        },
      })
      .catch(() => {});
  } finally {
    clearInterval(monitor);
    active.delete(id);
  }
}
async function tick() {
  await db.workerHeartbeat.upsert({
    where: { id: workerId },
    create: { id: workerId },
    update: { seenAt: new Date() },
  });
  while (active.size < 2 && !stopping) {
    const claimed = await db.$transaction(async (tx) => {
      const jobs = await tx.$queryRaw<
        { id: string; payload: unknown }[]
      >`SELECT "id","payload" FROM "ExecutionJob" WHERE "status"='QUEUED' ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!jobs.length) return null;
      await tx.executionJob.update({
        where: { id: jobs[0].id },
        data: { status: "RUNNING", startedAt: new Date() },
      });
      return jobs[0];
    });
    if (!claimed) break;
    void processJob(claimed.id, claimed.payload);
  }
  if (Date.now() - lastCleanup > 30000) {
    lastCleanup = Date.now();
    const stale = await db.executionJob.findMany({
      where: { status: "RUNNING", startedAt: { lt: new Date(Date.now() - 120000) } },
    });
    for (const job of stale) {
      const p = spawn("docker", ["rm", "-f", `algovisual-${job.id}`], {
        windowsHide: true,
        stdio: "ignore",
      });
      p.on("error", () => {});
      await db.executionJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: {
          status: "FAILED",
          error: "Worker lease expired; container removed.",
          finishedAt: new Date(),
        },
      });
    }
    await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.workerHeartbeat.deleteMany({
      where: { seenAt: { lt: new Date(Date.now() - 60000) } },
    });
    await db.executionJob.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 86400000) }, status: { not: "RUNNING" } },
    });
  }
}
const shutdown = () => {
  stopping = true;
  for (const controller of active.values()) controller.abort();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
async function main() {
  console.log("AlgoVisual worker ready (two concurrent containers).");
  while (!stopping) {
    try {
      await tick();
    } catch (e) {
      console.error("Worker waiting for PostgreSQL:", (e as Error).message);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  while (active.size) await new Promise((resolve) => setTimeout(resolve, 100));
  await db.workerHeartbeat.deleteMany({ where: { id: workerId } });
  await db.$disconnect();
}
void main();
