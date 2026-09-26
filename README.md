# AlgoVisual

A DSA practice platform built with **Next.js, React, Node.js, PostgreSQL, and Prisma**. Compare up to six programs using best, average, and worst-case graphs, then run your own cases in **JavaScript, Python, Java, and C**.

## Start locally

Requires Node.js 22.12+ (tested on 24), npm, and Docker running Linux containers.

```sh
npm ci
cp .env.example .env.local
npm run db:up
npm run db:migrate
npm run runner:build
```

On PowerShell, use `Copy-Item .env.example .env.local`. Preserve existing environment files. Set `RUNNER_ENABLED=true`, then start these in separate terminals:

```sh
npm run worker
npm run dev
```

Open [localhost:3000](http://localhost:3000). Register to execute code and save private experiments. Graphs, the structure explorer, and JSON import/export work without signing in. PostgreSQL is required for accounts, saves, and the execution queue. No AI API key is required.

For an existing database, set `DATABASE_URL` and run `npm run db:migrate`. `.env.local` takes precedence over `.env`. Never commit credentials.

## Features

- Compare six programs with independent best/average/worst models, conditions, space costs, and editable constants.
- Slide, type, or animate input size from 1 to **10^9**. Overlay all cases or inspect one; choose linear/log runtime scales.
- Configure operation rate and time limit; see estimated TLE, largest passing input, and the first pair's approximate crossover.
- Use insertion, selection, bubble, or merge sort, linear search, or binary search in four languages. Paste custom source for a conservative complexity suggestion.
- Explore **18 data structures** with editable inputs, operations, playback, and four-language examples: array, matrix, singly/doubly linked list, stack, queue, deque, circular queue, hash map/set, BST, heap, graph, trie, disjoint set, Fenwick tree, segment tree, and sparse table.
- Enter eight shared cases with optional expectations and best/average/worst/custom labels. Compare measured time, correctness, compiler/runtime errors, and actual TLE. Cancel active runs.
- Submit full programs or common LeetCode-style functions and Solution methods, including list/tree adapters.
- Benchmark 1-8 sizes up to 20,000 with repeatable generators and 1/3/5/7 repetitions. Plot medians and min/max, inspect empirical trends, and export CSV.
- Save/load source, models, test inputs/results, and benchmark snapshots in your account; export/import validated JSON.
- Accounts, password changes with session revocation, quotas, and a durable PostgreSQL job queue with a separate worker.

## Estimates and measurements

Estimated time is `(factor * growth(n) + overhead) / operationsPerSecond`. Defaults illustrate constant-factor tradeoffs, not measured language benchmarks. A **10^8-operation budget** permits `n = 10^4` for a cost-1 quadratic model, not `n = 10^8`. A cost-1 linear model at `n = 10^9` exceeds that budget. Constants and overhead change the threshold.

Arbitrary source analysis is a low-confidence suggestion, never a proof. Review detected loop/recursion assumptions and override each case. Exact library implementations have reviewed models. A supplied case label does not establish an asymptotic best/worst case.

Measurements include interpreter/JVM startup, exclude compilation/container startup, and can be noisy. Empirical fits are observations; they do not silently recalibrate the estimate curves. Structure demos use fixed examples: adapt their stdin handling before benchmarking growth.

## Input conventions

Library algorithms read `n`, then `n` integers, then an optional target:

```text
6
4 1 6 2 5 3
4
```

Sorts output sorted values; searches output a zero-based index or -1. Binary search requires sorted input. Change expectations when comparing different tasks.

Method input is a JSON **array of arguments**, e.g. `[[2,7,11,15],9]`. Lists use value arrays; trees use level-order arrays with null gaps. Choose entry point and Auto/Program/Method under Submission settings. Full Java programs use class Main. Unsupported signatures need a full stdin/stdout wrapper. See [adapter contracts](docs/api.md).

JSON expectations compare structurally and preserve spaces inside strings. Plain text normalizes whitespace. Blank expectations skip judging. Limits: 30,000 source characters, 200,000 stdin characters, 16,000 returned characters per output stream.

## Commands

| Command                                     | Purpose                                       |
| ------------------------------------------- | --------------------------------------------- |
| `npm run dev`                               | Next.js development server                    |
| `npm run worker`                            | Execution worker; needs PostgreSQL and Docker |
| `npm run build` / `npm start`               | Production build / server                     |
| `npm test` / `npm run typecheck`            | Unit tests / TypeScript                       |
| `npm run test:integration`                  | Runner, language adapters, database checks    |
| `npm run test:e2e`                          | Chrome browser flows; start worker first      |
| `npm run db:up` / `npm run db:migrate`      | Start local DB / apply migrations             |
| `npm run db:generate` / `npm run db:studio` | Generate Prisma / inspect data                |
| `npm run runner:build`                      | Build execution image                         |

Install browser dependencies with `npx playwright install chrome`. GitHub Actions tests pushes to main.

## Documentation

- [Architecture and persistence](docs/architecture.md)
- [API and adapter contracts](docs/api.md)
- [Deployment and operations](docs/deployment.md)
- [Feature coverage](docs/progress.md)
- [Contributor instructions](claude.md)

Production Docker/Compose, Caddy, and systemd examples are included. Public execution requires a dedicated Linux runner with gVisor; production workers refuse to start without it. Local Docker tests do not validate that production boundary.
