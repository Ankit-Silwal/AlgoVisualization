# AlgoVisual

A DSA playground for comparing up to six programs, exploring **best, average, and worst cases**, and running the same test inputs against JavaScript, Python, Java, and C implementations.

Built with **Next.js App Router, React, TypeScript, Node.js route handlers, Prisma ORM, and PostgreSQL**. Program execution uses a separate, resource-limited Docker container for each job.

## Quick start

Requirements: Node.js 22.12+ (tested with Node 24), npm, Docker Desktop running Linux containers, and Git.

```sh
npm ci
cp .env.example .env.local
npm run db:up
npm run db:migrate
npm run runner:build
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Set `RUNNER_ENABLED=true` in `.env.local` after building the runner, then:

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). The model graph works without a database or runner. Saving requires PostgreSQL; actual execution requires Docker and an enabled runner. Errors in these optional services appear in the UI without disabling comparisons. Never commit `.env.local` or real credentials.

For your own database, set `DATABASE_URL` to its PostgreSQL connection string and run `npm run db:migrate`. `.env.local` takes precedence over `.env` in both Next.js and Prisma CLI. No API key is required for the heuristic analyzer.

## What you can do

- Compare up to six algorithms; add library implementations or your own code.
- Overlay best/average/worst curves or inspect any case independently.
- Move `n` from 1 to 10⁹ with a logarithmic slider, numeric input, or animation.
- Adjust growth functions, per-case cost factors, fixed overhead, operation rate, and time limit.
- See estimated TLE, all three case times, space complexity, and the first pair's approximate crossover.
- Explore insertion, selection, bubble, and merge sort; linear and binary search, in all four languages.
- Browse ten common data structures with operation costs, caveats, and runnable demos in each language.
- Enter up to eight stdin/expected-stdout test cases with best/average/worst/custom labels. Run the same cases against every program and compare measured bars, outputs, correctness, compiler errors, runtime errors, and timeouts.
- Save/load comparison experiments in PostgreSQL via Prisma; export/import validated JSON for portability.

## Estimates versus measurements

The graph uses `time = (factor × growth(n) + overhead) / operationsPerSecond`. Defaults are illustrative, **not language-specific benchmarks**. A budget of 10⁸ operations is not an input size of 10⁸: a cost-1 quadratic model hits it at `n = 10⁴`. Constant costs change this threshold. Crossover search is approximate and scans `n = 1…10⁹`.

Automatic arbitrary-code complexity analysis is not reliable. The analyzer recognizes exact reviewed examples; otherwise it gives a low-confidence loop-based placeholder and explains its assumptions. Users can override every case. It does not infer input distributions or hidden library/recursive costs.

Actual test execution reports process wall time, including interpreter/JVM startup but excluding compilation and container startup. Very short cases are noisy. Measurements are separate from model estimates and do not automatically calibrate curves. Case labels are user annotations: reversed input is not the worst case for every algorithm. Saved comparison experiments currently include code/models/settings, not unsaved test-case edits or run history.

## Input conventions

Library algorithms accept the same whitespace-separated input:

```text
6
4 1 6 2 5 3
4
```

First `n`, then `n` integers, then an optional search target. Sorts print the sorted values. Searches print the zero-based index or `-1`. Binary search requires sorted input. The default expected outputs suit sorting; change them for searches.

- **JavaScript:** named functions can use `(array, target)` and return a value or array. The runner settings expose the entry point. Leave it blank for a full Node.js stdin/stdout program. Arrow functions can be used by entering their variable name explicitly.
- **Python:** submit a complete Python 3 program reading stdin and printing results.
- **Java:** submit a complete program with `public class Main` and `public static void main(String[] args)`.
- **C:** submit a complete C17 program with `main`, using stdin/stdout.
- Data-structure demos use fixed sample values and are labeled as such; adapt them to read stdin before treating them as input-scaled programs.

Expected output comparison ignores leading/trailing whitespace and normalizes whitespace runs. An empty expected output means “execute without judging.” Output display is limited to 16,000 characters per stream. Inputs are limited to 200,000 characters; C algorithm templates additionally cap `n` at 20,000.

## Commands

| Command                       | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `npm run dev`                 | Development server                                            |
| `npm run build` / `npm start` | Production build/server                                       |
| `npm test`                    | Model, validation, and runner-contract tests                  |
| `npm run typecheck`           | TypeScript checks                                             |
| `npm run db:up`               | Local PostgreSQL on port 5437                                 |
| `npm run db:migrate`          | Apply committed Prisma migrations                             |
| `npm run db:generate`         | Regenerate Prisma Client                                      |
| `npm run db:studio`           | Inspect the database                                          |
| `npm run runner:build`        | Build the four-language runner image                          |
| `npm run test:integration`    | Run Docker language/timeout and PostgreSQL integration checks |

## Project docs

- [Architecture and data model](docs/architecture.md)
- [API and execution contracts](docs/api.md)
- [Deployment and security boundaries](docs/deployment.md)
- [Contributor / Claude instructions](claude.md)

This is a local, shared workspace with no user authentication or ownership partitioning. The execution service is **not a hardened public code judge**. See deployment notes before internet exposure.
