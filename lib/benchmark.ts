import { Case, Complexity, LABELS, operations } from "./algorithms";
export type BenchmarkPoint = {
  algorithmId: string;
  name: string;
  color: string;
  n: number;
  case: Case;
  medianMs: number;
  minMs: number;
  maxMs: number;
  samplesMs: number[];
  status: string;
};
export type BenchmarkState = {
  signature: string;
  createdAt: string;
  points: BenchmarkPoint[];
  sizes: number[];
  repetitions: number;
  template: string;
  seed: number;
};
export function generatedInput(
  n: number,
  c: Case,
  seed: number,
  template = "{{n}}\n{{values}}\n{{target}}",
): string {
  if (!Number.isInteger(n) || n < 1 || n > 20000)
    throw new Error("Measured sizes must be integers from 1 to 20,000.");
  const values = Array.from({ length: n }, (_, i) => i + 1);
  let state = seed >>> 0;
  if (c === "worst") values.reverse();
  if (c === "average")
    for (let i = n - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = state % (i + 1);
      [values[i], values[j]] = [values[j], values[i]];
    }
  const target = c === "best" ? values[0] : c === "average" ? values[Math.floor(n / 2)] : -1;
  return template
    .replaceAll("{{n}}", String(n))
    .replaceAll("{{values}}", values.join(" "))
    .replaceAll("{{json}}", JSON.stringify(values))
    .replaceAll("{{sorted}}", JSON.stringify(Array.from({ length: n }, (_, i) => i + 1)))
    .replaceAll("{{target}}", String(target));
}
export function parseSizes(text: string): number[] {
  const sizes = [...new Set(text.split(",").map((x) => Number(x.trim())))].sort((a, b) => a - b);
  if (
    !sizes.length ||
    sizes.length > 8 ||
    sizes.some((n) => !Number.isInteger(n) || n < 1 || n > 20000)
  )
    throw new Error("Enter 1–8 comma-separated sizes between 1 and 20,000.");
  return sizes;
}
export function empiricalFit(points: BenchmarkPoint[]): {
  label: string;
  r2: number;
  note: string;
} {
  const valid = points.filter((p) => p.status === "ok");
  if (valid.length < 5)
    return {
      label: "More samples needed",
      r2: 0,
      note: "Use at least five different input sizes for an empirical fit.",
    };
  const y = valid.map((p) => p.medianMs),
    mean = y.reduce((a, b) => a + b, 0) / y.length;
  const spread = Math.max(...y) - Math.min(...y),
    noise = Math.max(...valid.map((p) => p.maxMs - p.minMs));
  if (spread < Math.max(2, noise * 2))
    return {
      label: "Noise dominates",
      r2: 0,
      note: "Runtime variation is too small relative to run-to-run noise or process startup.",
    };
  let best = {
    label: "Unclear growth",
    r2: 0,
    note: "No tested growth model fits these measurements well.",
  };
  for (const c of ["log", "linear", "nlogn", "quadratic", "cubic"] as Complexity[]) {
    const x = valid.map((p) => operations(c, p.n)),
      xm = x.reduce((a, b) => a + b, 0) / x.length;
    const denom = x.reduce((sum, v) => sum + (v - xm) ** 2, 0);
    const slope = x.reduce((sum, v, i) => sum + (v - xm) * (y[i] - mean), 0) / denom;
    if (slope <= 0) continue;
    const intercept = Math.max(0, mean - slope * xm);
    const total = y.reduce((sum, v) => sum + (v - mean) ** 2, 0);
    const error = y.reduce((sum, v, i) => sum + (v - (intercept + slope * x[i])) ** 2, 0);
    const r2 = 1 - error / total;
    if (r2 > best.r2)
      best = {
        label: LABELS[c],
        r2,
        note: "Empirical resemblance over the measured range, not a proof of asymptotic complexity.",
      };
  }
  return best.r2 < 0.85 ? { ...best, label: "Unclear growth" } : best;
}
