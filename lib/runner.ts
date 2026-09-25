import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { wrapSubmission } from "./submissions";
export const runSchema = z.object({
  language: z.enum(["JavaScript", "Python", "Java", "C"]),
  code: z.string().min(1).max(30000),
  stdin: z.string().max(200000),
  timeout: z.number().min(0.1).max(5).default(2),
  mode: z.enum(["auto", "program", "function"]).optional(),
  entrypoint: z
    .string()
    .regex(/^[a-zA-Z_$][\w$]*$/)
    .max(100)
    .optional(),
});
export type RunInput = z.infer<typeof runSchema>;
export type RunResult = {
  status: "ok" | "error" | "tle" | "compile_error";
  durationMs: number;
  stdout: string;
  stderr: string;
};
export function prepareCode(job: RunInput): string {
  return wrapSubmission(job);
}
export async function runProgram(job: RunInput): Promise<RunResult> {
  const preparedCode = prepareCode(job);
  const name = `algovisual-${randomUUID()}`;
  const args = [
    "run",
    "--rm",
    "-i",
    "--name",
    name,
    "--network",
    "none",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--memory",
    "384m",
    "--memory-swap",
    "384m",
    "--cpus",
    "1",
    "--pids-limit",
    "64",
    "--ulimit",
    "fsize=1048576:1048576",
    "--ulimit",
    "nofile=128:128",
    "--tmpfs",
    "/work:rw,exec,nosuid,size=64m,mode=1777",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=16m,mode=1777",
    "algovisual-runner:local",
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "",
      stderr = "",
      settled = false;
    const cleanup = () => {
      const p = spawn("docker", ["rm", "-f", name], { windowsHide: true, stdio: "ignore" });
      p.on("error", () => {});
    };
    const finish = (error?: Error, result?: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(result!);
    };
    const timer = setTimeout(() => {
      child.kill();
      cleanup();
      finish(undefined, {
        status: "tle",
        durationMs: job.timeout * 1000,
        stdout: "",
        stderr: "Container job exceeded the 25-second overall limit (including compilation).",
      });
    }, 25000);
    child.on("error", () => {
      cleanup();
      finish(new Error("Docker is unavailable. Start Docker and build the runner image."));
    });
    child.stdin.on("error", () => {});
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 100000) {
        child.kill();
        cleanup();
        finish(new Error("Runner output exceeded the size limit."));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-8000);
    });
    child.on("close", (code) => {
      if (settled) return;
      if (code !== 0) {
        cleanup();
        finish(
          new Error(
            stderr.includes("Unable to find image") || stderr.includes("pull access denied")
              ? "Runner image is missing. Run npm run runner:build first."
              : "Runner container failed. Check Docker availability and resource limits.",
          ),
        );
        return;
      }
      try {
        const data = z
          .object({
            status: z.enum(["ok", "error", "tle", "compile_error"]),
            durationMs: z.number().nonnegative().finite(),
            stdout: z.string().max(20000),
            stderr: z.string().max(20000),
          })
          .parse(JSON.parse(stdout));
        finish(undefined, data);
      } catch {
        finish(new Error("The runner returned invalid output."));
      }
    });
    child.stdin.end(JSON.stringify({ ...job, code: preparedCode }));
  });
}
