import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareCode, runSchema } from "../lib/runner";
import { hasSameOrigin } from "../lib/request-origin";
test("runner rejects invalid languages, oversized input and unsafe entrypoint text", () => {
  const base = {
    language: "JavaScript",
    code: "function solve(a){return a}",
    stdin: "0",
    timeout: 2,
  };
  assert.ok(runSchema.safeParse(base).success);
  assert.equal(runSchema.safeParse({ ...base, language: "sh" }).success, false);
  assert.equal(runSchema.safeParse({ ...base, entrypoint: "solve(); evil()" }).success, false);
  assert.equal(runSchema.safeParse({ ...base, timeout: 60 }).success, false);
  assert.equal(runSchema.safeParse({ ...base, stdin: "x".repeat(200001) }).success, false);
});
test("same-origin checks use the browser-facing Host rather than Next's bind address", () => {
  assert.equal(
    hasSameOrigin(
      new Request("http://0.0.0.0:3000/api/run", {
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    hasSameOrigin(
      new Request("http://0.0.0.0:3000/api/run", {
        headers: { host: "localhost:3000", origin: "https://unrelated.example" },
      }),
    ),
    false,
  );
  assert.equal(
    hasSameOrigin(new Request("http://localhost:3000/api/run", { headers: { origin: "null" } })),
    false,
  );
});
test("only explicit JavaScript entry points get an input adapter", () => {
  const base = {
    language: "JavaScript" as const,
    code: "function solve(a){return a}",
    stdin: "0",
    timeout: 2,
  };
  assert.equal(prepareCode(base), base.code);
  assert.match(prepareCode({ ...base, entrypoint: "solve" }), /Promise.resolve\(solve\(/);
  const python = { ...base, language: "Python" as const, code: "print(1)", entrypoint: "solve" };
  assert.equal(prepareCode(python), python.code);
});
