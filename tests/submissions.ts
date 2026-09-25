import assert from "node:assert/strict";
import { runProgram } from "../lib/runner";
const cases = [
  {
    language: "JavaScript" as const,
    code: "var twoSum = function(nums, target) { return [0, 1]; };",
    stdin: "[[2,7,11,15],9]",
    expected: "[0,1]",
  },
  {
    language: "Python" as const,
    code: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        return [0, 1]",
    stdin: "[[2,7,11,15],9]",
    expected: "[0,1]",
  },
  {
    language: "Java" as const,
    code: "class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0,1}; } }",
    stdin: "[[2,7,11,15],9]",
    expected: "[0,1]",
  },
  {
    language: "C" as const,
    code: "int* twoSum(int* nums,int numsSize,int target,int* returnSize){*returnSize=2;int* r=malloc(2*sizeof(int));r[0]=0;r[1]=1;return r;}",
    stdin: "[[2,7,11,15],9]",
    expected: "[0,1]",
  },
  {
    language: "Python" as const,
    code: "class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        while head:\n            nxt=head.next\n            head.next=prev\n            prev=head\n            head=nxt\n        return prev",
    stdin: "[[1,2,3]]",
    expected: "[3,2,1]",
  },
  {
    language: "Java" as const,
    code: "class Solution { public int depth(TreeNode root) { return root==null?0:1+Math.max(depth(root.left),depth(root.right)); } }",
    stdin: "[[1,2,3,null,4]]",
    expected: "3",
  },
  {
    language: "Java" as const,
    code: "class Solution { public String echo(String s) { return s; } }",
    stdin: '["hello world"]',
    expected: '"hello world"',
  },
];
async function main() {
  for (const item of cases) {
    const result = await runProgram({ ...item, timeout: 2 });
    assert.equal(result.status, "ok", `${item.language}: ${result.stderr}`);
    assert.equal(result.stdout.trim(), item.expected);
    console.log(`PASS ${item.language} method wrapper`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
