import type { RunInput, RunResult } from "./runner";
export async function executeCode(input: RunInput, signal?: AbortSignal): Promise<RunResult> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const queued = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("algovisual:sign-in"));
    throw new Error(queued.error);
  }
  const cancel = () => {
    void fetch(`/api/jobs/${queued.id}`, { method: "DELETE", keepalive: true });
  };
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) cancel();
  try {
    for (let i = 0; i < 360; i++) {
      if (signal?.aborted) throw new Error("Execution cancelled.");
      const r = await fetch(`/api/jobs/${queued.id}`, { signal });
      const job = await r.json();
      if (!r.ok) throw new Error(job.error);
      if (job.status === "SUCCEEDED") return job.result as RunResult;
      if (job.status === "FAILED") throw new Error(job.error || "Execution failed.");
      if (job.status === "CANCELLED") throw new Error("Execution cancelled.");
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    cancel();
    throw new Error("The queued job took too long and was cancelled.");
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
