# Implementation Plan — Rubik's Cube Algorithm Laboratory (v3)

**Version:** 3.0
**Frontend:** JavaScript + React + Vite
**Backend:** JavaScript + Node.js + Express
**Database/Auth:** Supabase
**Algorithm engine:** C++
**Supersedes:** `docs/product/implementation-plan-v2.md`
**Related docs:** `docs/architecture/frontend-design.md`, `docs/architecture/system-architecture.md`, `docs/architecture/api-contract.md`, `docs/architecture/solver-integration.md`, `docs/algorithms/*.md`, `docs/deployment/*.md`

## 1. What Changed From v2

v2 sequenced the project algorithm-first: cube engine → search algorithms → Supabase → API → UI, with the UI arriving last. v3 inverts that: **the entire UI ships first, fully designed and clickable, against mock data** — matching the approved screenshots already captured in `docs/architecture/` (`Landing Page.png`, `sign-in.png`, `sign-up.png`, `Solver Workspace.png`, `Benchmark Workspace.png`, `dashboard.png`, `history.png`, `result-details.png`, `documentation.png`) and specified pixel-for-pixel in `frontend-design.md`. Every phase after that is a **data-source swap behind screens that already exist**, never a new-screen build. The C++ solver engine is still built in isolation, but in parallel with the frontend rather than before it.

Sixteen phases collapse into four. Each phase still ends in a testable, demoable artifact.

```text
Phase 1  Frontend — full UI, mock data
Phase 2  Solver Engine — C++, standalone, CLI-only
Phase 3  Backend, Data & Integration — wire real data behind Phase 1's screens (Redis deferred to Future Plan)
Phase 4  Testing, Deployment & Polish
```

Phases 1 and 2 have no dependency on each other and can run concurrently. Phase 3 is the merge point. Phase 4 only starts once Phase 3 is functionally complete.

## 2. Phase 1 — Frontend (Complete UI, Mock Data)

### Goal

Every page in the product exists, is navigable, and is visually identical to the approved designs — before any backend, Supabase, or C++ exists. A stakeholder can click through the entire product on day one.

### Scope: pages (per `website-flow-v2.md` site map and the reference screenshots)

1. Landing (`/`) — matches `Landing Page.png`.
2. Sign In (`/auth/sign-in`) — matches `sign-in.png`.
3. Sign Up (`/auth/sign-up`) — matches `sign-up.png`.
4. Auth callback / reset-password routes — states only, no real Supabase calls yet.
5. Solver Workspace (`/solver`) — matches `Solver Workspace.png`.
6. Benchmark Workspace (`/benchmark`) — matches `Benchmark Workspace.png`.
7. Dashboard (`/dashboard`) — matches `dashboard.png`.
8. History (`/history`) — matches `history.png`.
9. Result Details (`/results/:id`) — matches `result-details.png`.
10. Documentation (`/docs/:topic`) — matches `documentation.png`.
11. Admin console shell (`/admin/*`) — layout only, per `website-flow-v2.md` §4.10 (no reference screenshot yet — build to the same design system, flag for design review).

### Tasks

1. Scaffold `apps/web` (Vite + React + React Router), ESLint/Prettier, Tailwind, feature-folder structure — per `frontend-design.md` tokens (colors, type scale, spacing, radii in §2–§5 of that doc).
2. Build the shared component library first, driven directly by `frontend-design.md` §6: primary/secondary/text buttons, cards, status-badge pills, inputs, checkboxes, tables, progress bars, log-console blocks, the dark pseudocode block, the donut chart, the navbar, and the footer. Every component takes its color/spacing/radius values from the token tables in that doc — no ad hoc styling.
3. Build the cube visualization component in both modes described in `frontend-design.md` §7: the compact landing-page preview cube and the full unfolded 2D sticker net (cross layout) used in the Solver Workspace.
4. Build each page listed above using the shared components, matching the page-by-page specs in `frontend-design.md` §8 exactly (layout grid, card placement, labels, badge colors).
5. Wire client-side routing and route guards per `website-flow-v2.md` §3 (guest/registered/admin access rules), but back every guard with **local mock session state** — no real Supabase yet.
6. Create a mock data layer: fixture JSON for scrambles, solve results, benchmark suites, history rows, and documentation content, shaped exactly like the payloads defined in `api-contract.md` §2 (same field names, same types) so swapping in the real API in Phase 3 requires no component changes — only a data-source swap.
7. Implement client-side move application and cube-state rendering (visual only — the authoritative move-engine logic still lives in C++ from Phase 2; the frontend's copy is for instant UI feedback and is revalidated server-side later).
8. Implement solution replay controls (play/pause/next/previous/restart/speed/jump-to-move) against mock solution data.
9. Add reduced-motion and keyboard-navigation support from the start (PRD §9) — cheaper to build in from day one than retrofit later.
10. Component and page-level tests (Vitest + React Testing Library): every shared component renders with correct tokens; every page renders against its fixture data without a backend running.

### Deliverables

- A fully clickable, visually-approved application running on `npm run dev` with zero backend dependencies.
- Shared component library matching `frontend-design.md` token-for-token.
- Fixture data layer shaped to the final API contract.
- Vitest suite covering components and pages.

### Exit criteria

Every page in the site map renders and is navigable; every component visually matches its reference screenshot; no page makes a network call to anything other than the local fixture layer; fixture payload shapes are reviewed against `api-contract.md` and confirmed to require no restructuring later.

## 3. Phase 2 — Solver Engine (C++, Standalone)

### Goal

A correct, tested, CLI-only C++ library that can parse a scramble, validate a state, and solve it with BFS, DFS, IDDFS, or IDA\*, with full metrics — entirely decoupled from the web stack. Runs concurrently with Phase 1.

### Tasks

1. Scaffold the CMake project (`rubiks_core`, `rubiks_solver`, `rubiks_tests`, `rubiks_benchmark` targets) inside `solver/`.
2. Implement the cube domain: face/color enums, solved sticker cube, all 18 moves, inverse lookup, parser/formatter, solved-state detection, seeded scramble generation, sticker↔piece↔compact conversions, deterministic hashing, and full validation — per `system-architecture.md` §2.4 and TRD §4–§5.
3. Implement `SolveOptions`/`SolveMetrics`/`SolveResult` and path reconstruction, shared by every algorithm.
4. Implement BFS, depth-limited DFS, and IDDFS per `docs/algorithms/bfs.md`, `dfs.md`, `iddfs.md` — including inverse-move pruning, timeout/depth/memory checks, and CLI benchmark output.
5. Implement the heuristic interface, `MisplacedPieces`, and `CornerEdgeLowerBound` per `docs/algorithms/heuristics.md`.
6. Implement IDA\* per `docs/algorithms/ida-star.md`: threshold-from-`h(root)` loop, minimum-exceeded-threshold tracking, move ordering, optional transposition table, optional trace sampling. IDA\* must stop safely on timeout, memory limit, cancellation, invalid state, or max depth, and must never report a failed/partial search as solved.
7. Every returned solution is re-applied to the original state independently and verified solved before being reported successful, on every algorithm — not just IDA\*.
8. Define and document the JSON Lines wire format the CLI/binary will expose over stdin/stdout, matching `solver-integration.md` §3, so Phase 3 has a frozen contract to integrate against.

### Deliverables

- `solver-engine` CLI: `rubiks_solver --scramble "R U R'" --algorithm IDA_STAR --heuristic CORNER_EDGE_LOWER_BOUND`.
- GoogleTest/Catch2 suite covering move invariants, encode/decode round-trips, cross-model agreement, validation rejection cases, and solution verification for BFS/DFS/IDDFS/IDA\* on committed fixtures.
- A benchmark table comparing the four algorithms on the same fixed scramble set, demonstrating the memory/time/optimality tradeoffs described in the algorithm docs.
- The frozen JSON Lines request/progress/result schema, ready for Phase 3.

### Exit criteria

All 18 moves and validation pass; BFS/IDDFS/IDA\* agree on optimal solution length for committed test cases and IDA\* matches or beats IDDFS on search time; DFS behavior (non-optimal, low memory) is demonstrated and documented; the CLI runs from a clean checkout with no web-stack dependency.

## 4. Phase 3 — Backend, Data & Integration

### Goal

Turn Phase 1's mock-data UI into the real product by wiring real data behind each screen, one concern at a time. **No page layout, component, or route changes in this phase** — only data sources change.

### 3a. Express API Foundation

1. Scaffold `apps/api` (Express, versioned router `/api/v1`, CORS for the Vite origin, helmet, JSON body limits, structured logging, correlation IDs, centralized error handler matching the envelope in `api-contract.md` §1).
2. Implement `cube/parse`, `cube/validate`, `cube/scramble` endpoints per `api-contract.md` §2.1 — backed by a JS reimplementation or a thin wrapper that shells out to the Phase 2 CLI for parsing/validation logic, whichever keeps a single source of truth for cube rules.
3. Point Phase 1's Solver Workspace scramble input and validation feedback at these real endpoints, replacing the mock data layer for cube-only operations. This is the first real seam between frontend and backend.
4. Add OpenAPI documentation for everything shipped so far.

### 3b. Supabase — Auth, Schema, RLS

1. Create Supabase project(s) for local/staging/production per `deployment/local-development.md`, `staging.md`, `production.md`.
2. Enable email/password auth; configure email confirmation and password-reset redirect URLs; create Google OAuth credentials and configure the provider.
3. Create `profiles`, `solve_jobs`, `solve_results`, `benchmark_suites`, `benchmark_cases`, `benchmark_results`, `shares`, `audit_logs` with foreign keys, constraints, timestamps, and indexes.
4. Enable RLS on every public table; write per-operation (select/insert/update/delete) policies for own-row access and scoped public-share reads.
5. Add profile creation on first sign-in (trigger or idempotent server call).
6. Seed demo data — non-production environments only.

### 3c. Wire Auth Into Existing Screens

1. Create the `supabase.js` browser client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only — service-role key never in `apps/web`).
2. Replace Phase 1's mock session state in Sign In / Sign Up / Dashboard / History / route guards with real `supabase.auth` calls: sign-up, sign-in, Google OAuth, password reset, `onAuthStateChange`, session restoration, sign-out.
3. Add Express bearer-token middleware and admin-role middleware; re-assert ownership server-side on every protected route regardless of RLS (defense in depth, per `system-architecture.md` §5).
4. Acceptance tests: email sign-up creates account/profile; confirmation link returns to the app; Google sign-in creates/finds a profile; refresh preserves session; sign-out blocks protected routes; User A cannot read User B's history; non-admin cannot reach `/admin/*`.

### 3d. Real Solve Jobs

1. Implement `POST /api/v1/solves`, `GET /api/v1/solves/:id`, `POST /api/v1/solves/:id/cancel` per `api-contract.md` §2.2.
2. Implement `solverService.js` with `mockSolverService.js` (already effectively proven by Phase 1's fixtures) and `cppSolverService.js`, which spawns the Phase 2 binary via the JSON Lines protocol frozen in `solver-integration.md` — argv array, never shell-concatenated.
3. Insert `solve_jobs` on creation, persist `solve_results` idempotently on completion, verify the returned solution independently before marking a job successful (mirrors the same rule enforced in Phase 2, now enforced again at the API boundary).
4. Map worker failure statuses (`TIMEOUT`, `MEMORY_LIMIT`, `INVALID_STATE`, `SOLVER_CRASHED`) to safe client-facing errors — never raw stderr/stack traces.
5. Swap Phase 1's mock solve results in the Solver Workspace and Result Details pages for real job data. No component changes — the fixture shapes from Phase 1 already match `api-contract.md`.

### 3e. Realtime & Benchmarking

1. Integrate Socket.IO events (`solve:started`, `solve:progress`, `solve:completed`, `solve:failed`, `solve:cancelled`, `benchmark:progress`, `benchmark:completed`) per `api-contract.md` §3 and `solver-integration.md` §5. Enforce event-subscription authorization so a user cannot subscribe to a job they don't own. Instead of Redis/Bull queues, solve and benchmark jobs will be executed directly in-process or via asynchronous child processes. (Redis queue is deferred to a future scaling phase).
2. Add polling fallback for when the WebSocket connection fails.
3. Implement `POST /api/v1/benchmarks` and `GET /api/v1/benchmarks/:id[/results]`; invoke the solver instances sequentially or concurrently in-process; aggregate mean/median/min/max/p95/stddev/success rate/timeout rate/avg length/nodes/memory.
4. Wire Phase 1's Benchmark Workspace (progress panel, results table, bar chart, actions) to this real data — again, no layout changes.
5. Add result caching in database or in-memory keyed by cube hash + algorithm + heuristic + solver version + options.

### 3f. History, Sharing, Admin — Real Data

1. Implement paginated/filterable `GET /api/v1/history/solves` against real Supabase data with RLS-backed ownership; wire Phase 1's History page to it.
2. Implement `POST /api/v1/solves/:id/share` and `GET /api/v1/shared/:shareId` with non-guessable, server-generated tokens, expiration, and revocation, returning only the safe field subset per `api-contract.md` §2.5; wire the Result Details "Share report" action to it.
3. Implement admin endpoints (`/api/v1/admin/jobs`, `/workers`, `/quotas`, `/audit-logs`) with server-enforced role checks and audit logging on every mutation; wire the Phase 1 admin console shell to real data.

### Deliverables

- A fully wired application: every screen built in Phase 1 now reads and writes real data through Supabase, Express, and the C++ solver.
- OpenAPI-documented API matching `api-contract.md`.
- RLS policies verified against a real hosted Supabase project.

### Exit criteria

Two test accounts cannot read each other's data; Google and email auth both work end-to-end; a real scramble solves through Express → C++ → Supabase with correct metrics; benchmark suites reproduce consistent aggregates; cancellation and timeout paths behave correctly; every Phase 1 screen now shows real data with zero visual regression from the approved designs.

## 5. Phase 4 — Testing, Deployment & Polish

### 4a. Testing Sequence

1. **Unit:** C++ move/state/algorithm tests (from Phase 2); JS validators and API helpers; React component/cube-control tests (from Phase 1).
2. **Integration:** API against a real Supabase test project; API against the mock solver; API against the real small C++ solver; job persistence/idempotency; WebSocket authorization.
3. **End-to-end (Playwright):** guest solves a shallow scramble; email user signs up/confirms/signs in/solves/views history; Google OAuth in a configured environment; user starts and cancels a long job; user runs a benchmark and opens charts; user creates and revokes a public share; admin cancels a job and sees an audit record.
4. **Performance:** fixed hardware/build flags/solver version/seed/scramble set; queue wait measured separately from solver time; successful, timeout, and memory-limit cases all covered; validated against the targets in `production.md` §5 (API validation < 300 ms, job submission < 500 ms, progress delay < 1 s).
5. **Security:** RLS isolation, invalid tokens, role-bypass attempts, rate limits, oversized payloads, unsafe scramble values, exposed-credential scans, private-share leakage.

### 4b. Deployment

Follow `docs/deployment/local-development.md`, `staging.md`, and `production.md` as written — local (Vite `5173` / Express `4000` / Supabase CLI) → staging (dedicated Supabase project, real OAuth redirect URLs, smoke tests, benchmark regression suite) → production (reviewed migrations, platform secret manager, optimized C++ worker build, HTTPS, independent API/worker scaling, health checks, rollback plan).

### 4c. CI/CD

Pull-request pipeline: install → JS lint/build → unit/component tests → C++ build (debug + release) → C++ tests → API tests → migration validation → integration smoke test → Docker build. Release pipeline: build versioned solver → run regression benchmarks → build/push images → apply Supabase migrations → deploy → health check → roll back on failure.

### 4d. Final Polish

Screenshots and demo data; empty/error/success states; loading skeletons; mobile layout; documentation and architecture diagram; benchmark-conditions display; error correlation IDs; remove debug logs and test credentials; verify no service-role key exists anywhere in the frontend build output; bundle-size and API-performance review; recruiter-friendly demo account or public demo mode.

### Exit criteria (Definition of Done)

All 18 moves work and are tested; invalid states are rejected; BFS/DFS/IDDFS/IDA\* return verified solutions for committed cases; email/Google auth work through Supabase with session restoration and logout; RLS prevents cross-user access; Express validates bearer tokens and roles; solver jobs have limits, cancellation, and safe failures; every documented page/flow is implemented and matches `frontend-design.md`; results and benchmarks persist; replay ends at the solved state; WebSocket failure falls back to polling; unit/integration/E2E/security/performance tests pass; local setup, CI, Docker, migrations, staging, and production deployment are documented; README contains screenshots, architecture, algorithm explanation, benchmark methodology, limitations, and a resume-ready project description.

## 5b. Future Plan — Redis & Distributed Queue Scaling (Deferred)

To scale the platform for heavy concurrent production usage and high horizontal scaling:
1. **Introduce Redis Queues:** Migrate backend solve and benchmark job management to Redis-backed queues (`bull` package using `queue:solve`, `queue:benchmark`, and progress tracking `job:{id}:progress`).
2. **Distributed Workers:** Extract the C++ solver execution from the main API process into dedicated, independently scalable worker processes consuming jobs from the Redis queue.
3. **Result Caching:** Configure Redis to cache puzzle solutions based on cube hashes to avoid duplicate database queries.

## 6. AI Coding Agent Execution Rules (unchanged from v2)

Implement one phase at a time. After each phase, run its tests and do not proceed with known failures. Do not replace C++ algorithms with mock responses once Phase 3d integration begins. Do not skip RLS because the frontend hides a page. Do not add payment or unnecessary AI features in the MVP. Keep all configuration in environment variables. Once Phase 1 ships, do not modify page layout, component structure, or visual design without an explicit design-review step — Phase 3's entire job is to feed real data into what Phase 1 already built, not to redesign it.
