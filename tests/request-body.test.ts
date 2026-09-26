import { test } from "node:test";
import assert from "node:assert/strict";
import { readLimitedBody } from "../lib/request-body";
test("request reading rejects oversized input before JSON parsing", async () => {
  assert.equal(
    await readLimitedBody(new Request("http://local", { method: "POST", body: "abcd" }), 3),
    null,
  );
  assert.equal(
    await readLimitedBody(new Request("http://local", { method: "POST", body: "éé" }), 3),
    null,
  );
  assert.equal(
    await readLimitedBody(new Request("http://local", { method: "POST", body: "abc" }), 3),
    "abc",
  );
});
