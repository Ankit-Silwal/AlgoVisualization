# Architecture

## Application flow

```text
Browser / Next.js workspace
  |- local case models -> SVG estimates, thresholds, crossover
  |- local structure state -> operation traces
  |- POST /api/analyze -> conservative suggestions (no execution)
  |- /api/auth + /api/experiments -> Prisma -> PostgreSQL
  |- POST /api/run -> ExecutionJob -> poll /api/jobs/:id
                                       ^
Separate worker -> SKIP LOCKED claim -> isolated Docker job -> result
```

Slider calculations stay in React. Node.js routes validate requests and enforce authentication, ownership, and quotas. The web process does not launch submitted programs. The worker runs two containers concurrently, monitors cancellation, publishes heartbeats, and handles stale jobs. Use one dedicated runner host; multiple worker processes can share it. Cross-host container cleanup is not coordinated.

## Code map

| Location                                               | Responsibility                                        |
| ------------------------------------------------------ | ----------------------------------------------------- |
| components/workspace.tsx                               | Comparison, editor, library, save/load, import/export |
| components/complexity-chart.tsx                        | Responsive SVG estimates                              |
| components/test-cases.tsx                              | Shared cases, expectations, results, cancellation     |
| components/benchmarks.tsx                              | Repeated measurements, curves, CSV                    |
| components/structure-studio.tsx, lib/structure-view.ts | Structure state, operations, layouts, playback        |
| components/account.tsx, lib/auth.ts                    | Accounts, scrypt, cookies, quotas                     |
| lib/algorithms.ts, lib/static-analysis.ts              | Models, crossover, budget search, static suggestions  |
| lib/library.ts, lib/structures-extra.ts                | Four-language examples                                |
| lib/schema.ts, lib/experiment-state.ts                 | Portable snapshot schemas                             |
| lib/queue-route.ts, lib/client-run.ts                  | Job admission and polling                             |
| lib/submissions.ts, lib/node-adapters.ts               | Method and node adapters                              |
| lib/runner.ts, runner/runner.py                        | Docker lifecycle, compilation, timing                 |
| scripts/worker.ts, prisma/                             | Worker and versioned database migrations              |

## Model semantics

Each algorithm has independent best/average/worst growth classes and factors, plus fixed overhead. Classes: constant, logarithmic, linear, linearithmic, quadratic, cubic, exponential. Extreme exponential values saturate safely. The input axis is logarithmic; runtime supports linear/log scales. Coincident case curves overlap.

In All cases mode, summary cards use average estimates and say so. The table marks each case separately. Crossover compares the first two programs. Defaults are illustrative, not calibrated timings.

Static analysis distinguishes some sequential/nested, fixed/log loops and recursive shapes. It masks comments/strings but is not a complete parser or complexity prover. Unknown code remains low confidence; hidden calls and input conditions need review.

Measured benchmark points hold samples, median, min/max, and status. Empirical fits require five points and reject noise-dominated runs. Generated case distributions are not guaranteed best/worst cases for arbitrary code.

## Persistence

- User: normalized unique email and salted scrypt password hash.
- Session: hashed opaque token and seven-day expiry. Password changes revoke previous sessions.
- Experiment: owner, name, JSONB snapshot, creation time. Snapshots include code/models/settings, test inputs/results/submission modes, and benchmark state. Legacy unowned records remain inaccessible to new accounts.
- ExecutionJob: account, payload, status, result/error, timestamps. A completed runner job is SUCCEEDED even when the program result is TLE or compile_error.
- WorkerHeartbeat: queue availability.
- RateLimit: shared database-backed buckets.

Worker cleanup expires old sessions, buckets, heartbeats, and jobs after 24 hours. Saved snapshots preserve copied results. RUNNING jobs older than 120 seconds are failed and their named container removed on the runner host. Apply migrations explicitly with npm run db:migrate.

Source changes mark measurements stale. Labels and expectations are user assertions. JSON import uses the same schema as database saves.
