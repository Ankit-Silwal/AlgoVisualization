# API and execution contracts

Node.js routes accept Zod-validated JSON. Errors contain an error string. Mutations reject mismatched Origin headers; CLI requests without Origin still require a session where applicable. APP_ORIGIN sets the public origin behind a proxy. Oversized bodies are rejected while streaming.

## Accounts

GET /api/auth returns `{user: {id,email} | null}`. POST accepts `{action,email,password,newPassword?}`; action is register, login, or change-password. Passwords are 10-128 characters. Registration returns 201; login/password change return 200 and set an opaque HttpOnly/SameSite=Strict cookie, Secure in production. Password changes require the current session/password, revoke previous sessions, and create a replacement. DELETE revokes the current session.

Registration can be disabled. There is no email verification, delivery, or forgotten-password reset. Limits: 30 attempts per address bucket and 15 per email per ten minutes; 2,000-byte body. TRUST_PROXY is only for a proxy that overwrites forwarded addresses.

## Analysis

POST /api/analyze: `{name,language,code}` -> `{algorithm,confidence,notes}`. Exact reviewed matches return preset confidence; arbitrary snippets return low. No execution or account required. Limits: 30,000 source characters, 60 name characters, 120,000-byte body.

## Experiments

Authentication required:

- GET /api/experiments returns the latest 100 owned records, newest first.
- POST accepts experimentSchema and returns 201 `{id,name}`. Limit: 100 saves/hour, 5 MB body.
- DELETE /api/experiments/:id deletes an owned record; unavailable/other-account records return 404.

Snapshot: name, 1-6 unique-ID algorithms, n (1-10^9), caseMode, rate, timeLimit, optional tests and benchmark. See lib/schema.ts and lib/experiment-state.ts for exact fields. Import/export uses the same schema. Saved results are editable snapshots, not tamper-proof judge records.

## Execution queue

POST /api/run requires a session, RUNNER_ENABLED=true, and a worker heartbeat within 15 seconds:

```json
{
  "language": "Python",
  "code": "class Solution:\n    def solve(self, nums):\n        return sorted(nums)",
  "stdin": "[[3,1,2]]",
  "mode": "function",
  "entrypoint": "solve",
  "timeout": 2,
  "repetitions": 3
}
```

Returns **202 {id,status:"QUEUED"}**. Languages: JavaScript, Python, Java, C. Limits: 30,000 source characters, 200,000 stdin characters, 1 MB body, timeout 0.1-5 seconds, repetitions 1-7. Defaults: auto mode, two seconds, one repetition. Per-account admission limits: four pending jobs, 240 per ten minutes, 2,000 per day.

GET /api/jobs/:id returns owned status/result/error. Lifecycle: QUEUED -> RUNNING -> SUCCEEDED/FAILED; DELETE transitions queued/running jobs to CANCELLED. Other accounts see 404. Worker cancellation removes the active container. Jobs expire after 24 hours.

Result: `{status,durationMs,stdout,stderr,samplesMs,minMs,maxMs}`. Program statuses: ok, error, tle, compile_error. Compilation has a separate 12-second limit; overall deadline is 20 seconds + repetitions * timeout. Process timing includes interpreter/JVM startup but excludes compilation/container startup. First failed repetition stops further samples. Output is bounded to 16,000 characters/stream. The browser judges expected output.

HTTP errors: 400 invalid data/JSON; 401 unauthenticated; 403 origin/disabled registration; 404 resource unavailable; 413 body too large; 429 quota; 503 unavailable database/worker/service.

## Method adapters

Program mode bypasses adapters and uses supplied stdin/stdout. Full Java programs use Main. Function mode forces wrapping; auto detects common forms. Set an explicit entry point for helpers; overloaded Java methods need a unique name.

JSON input is an argument array, e.g. `[[2,7,11,15],9]`. Whitespace library input also adapts to array/target arguments.

| Language   | Common supported forms                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| JavaScript | Named/assigned functions, Solution methods, JSON arguments/results, nodes by conventional argument names                             |
| Python     | Functions/Solution methods, annotations, primitives/lists, ListNode/TreeNode; annotated -> None outputs the mutated first argument   |
| Java       | Solution methods, primitives, strings, arrays, basic Lists, ListNode/TreeNode; void outputs first argument                           |
| C          | Scalars, numeric arrays, Size/Length/Len parameters, int-array returns with returnSize, strings, common ListNode/TreeNode signatures |

Lists use value arrays; trees use level-order arrays with null gaps. JavaScript/Python recognize head, head1, head2, l1, l2, root. Node output walks are bounded. Custom types, arbitrary C structs, nested Java generic collections, overloaded signatures, and stateful design-problem sequences need a complete stdin/stdout wrapper. C string returns use plain text. This is a convenience adapter, not a complete LeetCode judge.

JSON expectations compare structurally and preserve string whitespace. Plain text normalizes whitespace. Empty expectations skip judging. Matching an expectation does not prove algorithm correctness.
