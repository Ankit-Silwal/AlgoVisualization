import { test } from "node:test";
import assert from "node:assert/strict";
import { generatedInput, parseSizes, empiricalFit, BenchmarkPoint } from "../lib/benchmark";
test("input generation is reproducible and keeps the same values across cases", () => {
  assert.equal(generatedInput(100, "average", 42), generatedInput(100, "average", 42));
  assert.notEqual(generatedInput(100, "average", 42), generatedInput(100, "average", 43));
  assert.equal(generatedInput(3, "best", 1, "{{json}}"), "[1,2,3]");
  assert.equal(generatedInput(3, "worst", 1, "{{json}}"), "[3,2,1]");
  assert.equal(generatedInput(3, "average", 1, "{{sorted}}"), "[1,2,3]");
});
test("measured input sizes are bounded and normalized", () => {
  assert.deepEqual(parseSizes("1000,10,10,100"), [10, 100, 1000]);
  assert.throws(() => parseSizes("1000000000"));
  assert.throws(() => parseSizes("1,2,3,4,5,6,7,8,9"));
});
test("empirical fit distinguishes clear quadratic growth and refuses noisy data", () => {
  const ps: BenchmarkPoint[] = [100, 500, 1000, 5000, 10000].map((n) => ({
    algorithmId: "x",
    name: "x",
    color: "#ffffff",
    n,
    case: "average",
    medianMs: 10 + (n * n) / 1e4,
    minMs: 10 + (n * n) / 1e4,
    maxMs: 10 + (n * n) / 1e4,
    samplesMs: [],
    status: "ok",
  }));
  assert.equal(empiricalFit(ps).label, "O(n²)");
  assert.equal(empiricalFit(ps.slice(0, 2)).label, "More samples needed");
  assert.equal(
    empiricalFit(ps.map((p) => ({ ...p, medianMs: 10, minMs: 9, maxMs: 11 }))).label,
    "Noise dominates",
  );
});
