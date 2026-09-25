import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectCode } from "../lib/static-analysis";
test("sequential loops are linear but nesting is quadratic", () => {
  assert.equal(
    inspectCode("for(let i=0;i<n;i++){x++;} for(let j=0;j<n;j++){y++;}", "JavaScript").model.worst,
    "linear",
  );
  assert.equal(
    inspectCode("for(let i=0;i<n;i++){for(let j=0;j<n;j++){x++;}}", "JavaScript").model.worst,
    "quadratic",
  );
});
test("Python indentation and halving loops inform the model", () => {
  assert.equal(
    inspectCode("for i in range(n):\n    for j in range(n):\n        x += 1", "Python").model.worst,
    "quadratic",
  );
  assert.equal(inspectCode("while n > 1:\n    n //= 2", "Python").model.worst, "log");
});
test("fixed loop bounds and comments do not become input-dependent work", () => {
  assert.equal(
    inspectCode("for(int i=0;i<10;i++){ x++; } // while for", "C").model.worst,
    "constant",
  );
});
test("recursive patterns are reported as assumptions", () => {
  const r = inspectCode(
    "function fib(n){ if(n<2)return n;return fib(n-1)+fib(n-2);}",
    "JavaScript",
  );
  assert.equal(r.model.worst, "exponential");
  assert.ok(r.requiresReview);
});
