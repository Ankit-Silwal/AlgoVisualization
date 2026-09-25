import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, sessionToken } from "../lib/auth";
test("password hashing salts each password and rejects incorrect credentials", async () => {
  const one = await hashPassword("a-long-test-password"),
    two = await hashPassword("a-long-test-password");
  assert.notEqual(one, two);
  assert.ok(await verifyPassword("a-long-test-password", one));
  assert.equal(await verifyPassword("wrong", one), false);
  assert.equal(await verifyPassword("x", "invalid"), false);
});
test("session cookie parser ignores malformed values", () => {
  assert.equal(
    sessionToken(
      new Request("http://localhost", { headers: { cookie: "algovisual_session=bad" } }),
    ),
    null,
  );
  const token = "a".repeat(64);
  assert.equal(
    sessionToken(
      new Request("http://localhost", {
        headers: { cookie: `other=x; algovisual_session=${token}` },
      }),
    ),
    token,
  );
});
