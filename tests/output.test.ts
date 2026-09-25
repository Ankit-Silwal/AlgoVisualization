import { test } from "node:test";
import assert from "node:assert/strict";
import { outputsEqual } from "../lib/output";
test("judging JSON preserves string contents and ignores structural whitespace", () => {
  assert.ok(outputsEqual("[1, 2]", "[1,2]"));
  assert.equal(outputsEqual('"a  b"', '"a b"'), false);
  assert.ok(outputsEqual("1  2\n3", "1 2 3"));
  assert.equal(outputsEqual("[2,1]", "[1,2]"), false);
});
