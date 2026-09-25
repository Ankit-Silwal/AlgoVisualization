# Architecture

## Application flow

`app/page.tsx` renders the client workspace. React state controls compared algorithms, case mode, input size, operation rate, and time limit. Model calculations and the responsive SVG graph run locally for immediate slider feedback. Node.js API routes analyze code, persist experiments, and dispatch Docker execution.

```text
Browser / Next.js UI
  ├─ lib/algorithms.ts → estimates → SVG graph + comparison table
  ├─ POST /api/analyze → conservative heuristic suggestion
  ├─ GET/POST /api/experiments → Prisma → PostgreSQL
  └─ POST /api/run → Node child_process → isolated Docker job
       └─ Python orchestration → node / python3 / javac+java / gcc+binary
```

## Files

| Location                          | Responsibility                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `components/workspace.tsx`        | Comparison controls, library, editor, save/load, import/export                         |
| `components/complexity-chart.tsx` | Logarithmic input axis, optional log time, case line styles, time-limit overlay, hover |
| `components/test-cases.tsx`       | Shared stdin cases, expectations, run queue, measured results                          |
| `lib/algorithms.ts`               | Types, reviewed models, growth functions, runtime formatting, crossover, analyzer      |
| `lib/library.ts`                  | JavaScript/Python/Java/C examples and data-structure reference                         |
| `lib/schema.ts`                   | Zod validation for portable experiments                                                |
| `lib/db.ts`                       | Reused Prisma Client                                                                   |
| `lib/runner.ts`                   | Input validation, function adaptation, Docker lifecycle and limits                     |
| `runner/runner.py`                | Compilation, bounded output capture, execution timing and timeout                      |
| `prisma/`                         | PostgreSQL schema and versioned migrations                                             |

## Model semantics

An algorithm carries independent `best`, `average`, and `worst` growth classes and cost factors. Supported growth functions are constant, logarithmic (base two), linear, linearithmic, quadratic, cubic, and exponential. Fixed overhead is added before dividing by the machine's configured operation rate. Default factors demonstrate why insertion sort can beat merge sort for small inputs; they are not measured calibrations.

The graph input axis is always logarithmic. Its domain grows in powers of ten, up to 10⁹. Time can be logarithmic or linear. Extreme exponential values saturate numerically; plots cap their vertical range at 10¹⁵ ms and clip curves, while tables show a human-readable upper range. Coincident case curves may overlap (selection sort is a deliberate example).

With “All cases” selected, the fastest card, crossover card, and summary status use the **average** case, explicitly labeled. The table always shows all cases and marks TLE independently in each cell. The first two algorithms determine the crossover card; all programs remain visible on the graph.

## Persistence

`Experiment` has UUID `id`, `name`, JSONB `data`, and `createdAt`. Validated JSON contains algorithms, code, case growth models, factors, overhead, selected n/case, operation rate, and time limit. The API returns the latest 100 records. There are no automatic migrations on request: `prisma migrate deploy` applies versioned SQL at setup/deployment.

Test cases and execution results remain in the current browser component state. They are not included in comparison experiment exports yet. There is no authentication; all saved experiments belong to one shared workspace.

## Extension points

Add reviewed algorithms in `lib/algorithms.ts` and matching language templates in `lib/library.ts`; cover semantic claims with tests. Richer static analysis can replace `/api/analyze`, but must retain confidence/assumption labels and user overrides. Production execution should move behind an authenticated queue on dedicated isolated hosts, preserving the existing run request/result contract.
