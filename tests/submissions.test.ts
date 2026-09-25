import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseArguments,
  detectEntrypoint,
  isFunctionSubmission,
  wrapSubmission,
} from "../lib/submissions";
test("argument input supports JSON and the existing array contract", () => {
  assert.deepEqual(parseArguments("[[1,2],3]"), [[1, 2], 3]);
  assert.deepEqual(parseArguments("2\n1 2\n3"), [[1, 2], 3]);
  assert.throws(() => parseArguments("1000000000"));
});
test("method detection recognizes class solutions and respects full-program override", () => {
  assert.equal(
    detectEntrypoint("class Solution { public int find(int[] a) { return 0; }}", "Java"),
    "find",
  );
  assert.ok(
    isFunctionSubmission({
      language: "Python",
      code: "class Solution:\n def solve(self,a): return a",
      stdin: "[[1]]",
    }),
  );
  assert.equal(
    isFunctionSubmission({
      language: "C",
      code: "int solve(int n){return n;}",
      stdin: "[2]",
      mode: "program",
    }),
    false,
  );
});
test("unsupported C types return an actionable error before starting Docker", () => {
  assert.throws(
    () =>
      wrapSubmission({ language: "C", code: "int go(struct X* head){return 0;}", stdin: "[[1]]" }),
    /full-program/,
  );
});
