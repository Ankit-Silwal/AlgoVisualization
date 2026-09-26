# Contributor instructions

## Product intent

AlgoVisual teaches DSA with multi-program comparison. Preserve best, average, and worst cases equally. Keep theoretical estimates separate from measured execution. Support JavaScript, Python, Java, and C. Retain Next.js, Node.js routes, PostgreSQL, and Prisma ORM.

## Working agreements

- Finish a coherent feature, verify it, then commit and push to origin main. The owner explicitly requested frequent feature pushes. Do not rewrite remote history.
- Inspect git status and preserve user edits. Never commit credentials, dependencies, generated builds, or local environment files.
- Keep .env.example, README, and docs synchronized with behavior.
- Arbitrary source analysis remains a low-confidence suggestion with assumptions and editable models. Case labels are assertions, not proofs.
- Submitted source executes only in isolated worker containers. Never use host eval, host shell interpolation, unrestricted subprocesses, mounts, or network access for user programs.
- Enforce account ownership for saved experiments and jobs. Preserve session revocation and database-backed quotas.
- Explain amortized/balanced/key-length assumptions for data-structure costs. Fixed-size examples must not masquerade as measured variable-size algorithms.
- Preserve responsive layouts, accessible labels, useful error states, and reduced-motion behavior.

## Workflow

1. Read README, docs/architecture.md, and relevant source.
2. Run npm ci; copy .env.example only when local configuration is absent.
3. Start PostgreSQL, apply committed migrations, and generate Prisma Client after schema edits.
4. Run npm test, npm run typecheck, and npm run build for implementation changes.
5. For runner/database changes run npm run runner:build and npm run test:integration. Start npm run worker before npm run test:e2e. Check affected UI flows.
6. Commit verified features and push to main promptly.

## Key locations

- lib/algorithms.ts and lib/static-analysis.ts: models, budget thresholds, crossover, suggestions.
- lib/library.ts and lib/structures-extra.ts: four-language teaching examples.
- components/structure-studio.tsx and lib/structure-view.ts: editable visualizations.
- lib/schema.ts and lib/experiment-state.ts: full saved/exported state.
- lib/auth.ts and prisma/schema.prisma: accounts, quotas, persistence.
- lib/submissions.ts and lib/node-adapters.ts: method adapters.
- lib/runner.ts, runner/runner.py, scripts/worker.ts: isolated queued execution.

Production requires a dedicated Linux runner with gVisor; local tests use Docker. Do not describe local verification as proof of production isolation. Consult docs/deployment.md for host setup and docs/api.md for method-signature limitations.
