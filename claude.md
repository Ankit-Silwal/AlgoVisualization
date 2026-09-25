# Contributor instructions

## Product intent

AlgoVisual teaches DSA through multi-program comparison. Preserve best, average, and worst cases equally. Keep theoretical estimates clearly separate from measured execution. Support JavaScript, Python, Java, and C. Use Next.js with Node.js API routes, PostgreSQL, and **Prisma ORM**; do not replace the requested stack.

## Working agreements

- Complete a coherent feature, verify it, then commit and push to GitHub `main`. The repository owner explicitly requested regular feature pushes. Avoid rewriting remote history.
- Keep secrets in ignored `.env.local` or deployment environment variables. Update `.env.example` when settings change.
- Update README and `docs/` with behavior/contract changes.
- Preserve user edits; inspect `git status` before changing files.
- Do not claim arbitrary code's complexity is known. Mark heuristics low-confidence and retain model overrides.
- Treat case labels as user assertions, not verified asymptotic classifications.
- Do not run submitted code with host eval, VM, shell interpolation, or an unrestricted subprocess. All execution belongs in the isolated runner. Do not add host mounts or network access to execution containers.
- Data-structure complexity claims must name relevant assumptions (amortized, balanced, known node, key length).
- Maintain responsive layouts, keyboard-accessible controls, readable empty/error states, and reduced-motion support.

## Workflow

1. Read README, `docs/architecture.md`, and relevant source.
2. Use `npm ci`; copy `.env.example` to `.env.local` if no local configuration exists.
3. Start PostgreSQL and apply committed migrations. Regenerate Prisma Client after schema changes.
4. Implement and run `npm test`, `npm run typecheck`, `npm run build`.
5. For runner/database changes, build the image and run `npm run test:integration`. Browser-check user flows affected by UI changes.
6. Commit completed features and push to `origin main`. Never commit secrets, generated build output, or dependencies.

## Key commands and locations

- `npm run dev`: local server on port 3000.
- `npm run db:up`, `npm run db:migrate`, `npm run runner:build`: optional services.
- `lib/algorithms.ts`: case models, runtime estimates, crossover, analysis.
- `lib/library.ts`: language examples and data structures.
- `lib/schema.ts`, `prisma/schema.prisma`: API/persistence contracts.
- `lib/runner.ts`, `runner/runner.py`: restricted execution.
- `components/`: interactive workspace, graph, test cases.

Current boundaries: local shared workspace, no auth/ownership; single-server concurrency; experiments save model/code/settings but not test-case edits. Public execution needs additional isolation and access control described in deployment docs.
