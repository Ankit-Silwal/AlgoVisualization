import { test } from "node:test";
import assert from "node:assert/strict";
import {
  heapify,
  heapPop,
  prefixQuery,
  segmentQuery,
  searchBST,
  structureView,
  graphBFS,
} from "../lib/structure-view";
test("heap insertion and root extraction preserve min heap order", () => {
  let h = heapify([8, 3, 10, 1, 6, 14]);
  const out = [];
  while (h.length) {
    out.push(h[0]);
    h = heapPop(h);
  }
  assert.deepEqual(out, [1, 3, 6, 8, 10, 14]);
});
test("range structures return inclusive sums and valid node paths", () => {
  const a = [8, 3, 10, 1, 6, 14];
  assert.equal(prefixQuery(a, 2).sum, 21);
  assert.equal(segmentQuery(a, 1, 4).sum, 20);
  const tree = structureView("Segment tree", a, [], []);
  assert.equal(tree.nodes.length, 11);
  assert.ok(segmentQuery(a, 1, 4).visited.every((id) => tree.nodes.some((n) => n.id === id)));
});
test("BST and BFS search traverse actual links", () => {
  assert.deepEqual(searchBST([8, 3, 10, 1, 6, 14], 6).visited, ["0", "1", "4"]);
  assert.equal(searchBST([8, 3, 10, 1, 6, 14], 9).found, false);
  assert.deepEqual(
    graphBFS(
      [1, 2, 3, 4],
      [
        [1, 2],
        [2, 3],
      ],
      1,
    ),
    ["0", "1", "2"],
  );
});
test("trie shares prefixes and safely renders an empty structure", () => {
  const view = structureView("Trie", [], ["cat", "car"], []);
  assert.equal(view.nodes.length, 5);
  assert.equal(structureView("Array", [], [], []).nodes.length, 0);
});
