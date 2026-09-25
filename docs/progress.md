# Implemented extensions

## Submission adapters

Auto / Program / Method modes accept complete stdin programs or common LeetCode-style methods. JSON input is an argument array, for example `[[2,7,11,15],9]`. Java and Python `Solution` methods support primitive arguments, arrays, and common list/tree node conventions. Python supports typing annotations and Java uses reflection to convert arguments. C supports scalar parameters, numeric arrays, length parameters, and `int*` returns with `returnSize`; custom structs require a full stdin wrapper. See `lib/submissions.ts` for supported conversions. JSON method outputs are compared as text with whitespace normalization.

## Measured growth

The benchmark panel generates repeatable inputs at 1–8 sizes up to 20,000. Each plotted point is the median of 1–7 process runs, with min/max error bars and CSV export. Input templates let methods consume JSON or programs consume stdin. Best/average/worst labels describe the selected input distributions, not proven asymptotic cases. Empirical fitting requires five points and rejects noise-dominated measurements. No fit is an asymptotic proof.

## Accounts and private work

Register/sign in with email and a password of 10–128 characters. Passwords use salted scrypt; session cookies are HttpOnly, SameSite=Strict, and Secure in production. Sessions expire after seven days. Changing a password revokes other sessions. Experiments, code, test cases, run results, and benchmark snapshots are saved/exported together. Old anonymous experiments remain unowned and are not exposed to newly registered users.

`REGISTRATION_ENABLED=false` disables new registrations. Authentication has shared database-backed attempt limits; execution and saving have per-account quotas. `TRUST_PROXY=true` is only for a trusted reverse proxy which overwrites forwarded headers. Without it, login IP quotas use a shared local bucket.

## Separate execution worker

Start `npm run worker` in a second terminal after starting PostgreSQL and building the runner image. The web server only enqueues jobs; it does not spawn Docker. The worker claims jobs using PostgreSQL `FOR UPDATE SKIP LOCKED`, runs two containers concurrently, publishes heartbeat/status, handles cancellation, cleans stale jobs, and expires session/rate-limit records. Users may have four pending jobs and 240 submissions per ten minutes / 2,000 per day. Jobs are retained for 24 hours; saved experiments retain their copied results.

Production workers **refuse to start without `RUNNER_RUNTIME=runsc`**. Install and validate gVisor on a dedicated Linux runner host. The web host only needs PostgreSQL access and must not have Docker socket access. The local development configuration uses normal Docker containers; it does not validate the production gVisor deployment.
