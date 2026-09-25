# API

All routes use the Node.js runtime. JSON inputs are validated using Zod. Error responses contain an `error` string. Database connection details and submitted code are not exposed in server error responses.

## POST /api/analyze

Request: `{ "name": "My algorithm", "language": "Python", "code": "..." }`.

Returns `{ algorithm, confidence, notes }`. Exact reviewed matches have `confidence: "preset"`; arbitrary snippets have `confidence: "low"`. Analysis never executes code. Source limit: 30,000 characters; name: 60. Invalid data returns 400, oversized payload returns 413.

## GET /api/experiments

Returns the latest 100 `{ id, name, data, createdAt }` records, newest first. Database unavailability returns 503 with setup guidance.

## POST /api/experiments

Request follows `experimentSchema` in `lib/schema.ts`: `name`, `algorithms` (1–6), integer `n` (1–10⁹), `caseMode`, `rate`, `timeLimit`. All algorithm subfields are validated, including color and numerical factors. Returns 201 with `{ id, name }`. Invalid input returns 400/413; database unavailability returns 503. Prisma handles query parameterization.

## POST /api/run

```json
{
  "language": "JavaScript",
  "code": "function solve(a) { return a.sort((x,y) => x-y); }",
  "entrypoint": "solve",
  "stdin": "3\n3 1 2\n",
  "timeout": 2
}
```

Languages: `JavaScript`, `Python`, `Java`, `C`. `entrypoint` is optional and used only for JavaScript. A specified function receives `(array, target)` from the standard library input convention; omit it for a complete stdin/stdout program. Source limit 30,000 characters; stdin limit 200,000; timeout range 0.1–5 seconds. The server accepts at most two concurrent jobs per process. The UI submits jobs sequentially.

Response: `{ "status": "ok", "durationMs": 32.5, "stdout": "1 2 3\n", "stderr": "" }`.

Statuses: `ok`, `error`, `tle`, `compile_error`. A nonzero process exit is `error`. Compilation has a separate 12-second allowance; execution uses the requested limit. An overall 25-second watchdog also covers container startup and compilation. A compilation timeout is a compile error. Output is captured to disk under a file-size limit and returned with a 16,000-character limit per stream. Expected-output checking is performed by the client.

503 indicates a disabled/unavailable runner; 429 indicates capacity; 403 rejects a mismatched Origin header. An absent Origin is allowed for local CLI clients. These controls are not a replacement for production authentication.
