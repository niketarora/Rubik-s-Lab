# Technical Requirements Document (TRD)
# Rubik's Cube Algorithm Laboratory — Version 2

**Status:** Implementation-ready draft  
**Date:** 2026-08-09  
**Frontend:** JavaScript + React + Vite  
**Backend:** JavaScript + Node.js + Express  
**Database/Auth:** Supabase Postgres + Supabase Auth  
**Solver:** C++17+ worker  

## 1. Architecture

```text
React + Vite browser
        | HTTPS / WebSocket
Node.js + Express API
        | Supabase JS client
Supabase Auth + Postgres + RLS
        | optional Redis queue/cache
C++ solver worker
```

The browser handles presentation and interactive cube state. Express handles validation, authorization, job orchestration, and API contracts. Supabase handles identity and persistence. C++ is the authoritative computation engine. Redis is deferred to a future scaling phase for distributed queues, progress caching, and horizontal worker scaling.

## 2. Technology Stack

### Frontend

- JavaScript ES2022+.
- React.
- Vite.
- Tailwind CSS.
- React Router.
- Supabase JavaScript client.
- TanStack Query, optional.
- Zustand or Redux Toolkit, optional.
- React Three Fiber/Three.js, optional 3D.
- Recharts/ECharts.
- Vitest, React Testing Library, Playwright.

### Backend

- JavaScript on Node.js.
- Express.
- Supabase JavaScript client.
- Zod or Joi.
- Socket.IO or native WebSockets.
- OpenAPI/Swagger.
- Pino or Winston structured logging.

### Data and operations

- Supabase Postgres.
- Supabase Auth with email/password and Google OAuth.
- Supabase Row Level Security.
- Redis optional.
- Docker, Docker Compose, GitHub Actions.

### Solver

- C++17 or later.
- CMake.
- GoogleTest or Catch2.
- JSON Lines for MVP IPC; REST/gRPC optional later.

## 3. Repository

rubiks-cube/
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   │   ├── cube/
│   │   │   ├── solver/
│   │   │   ├── benchmark/
│   │   │   ├── dashboard/
│   │   │   ├── auth/
│   │   │   └── common/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── styles/
│   │   └── tests/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── authorization.js
│   │   │   ├── validation.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── cube/
│   │   │   ├── solves/
│   │   │   ├── benchmarks/
│   │   │   ├── jobs/
│   │   │   ├── history/
│   │   │   ├── sharing/
│   │   │   └── admin/
│   │   ├── services/
│   │   │   ├── solverService.js
│   │   │   ├── mockSolverService.js
│   │   │   ├── cppSolverService.js
│   │   │   ├── benchmarkService.js
│   │   │   └── notificationService.js
│   │   ├── repositories/
│   │   │   ├── solveRepository.js
│   │   │   ├── benchmarkRepository.js
│   │   │   ├── profileRepository.js
│   │   │   └── shareRepository.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── cubeRoutes.js
│   │   │   ├── solveRoutes.js
│   │   │   ├── benchmarkRoutes.js
│   │   │   ├── historyRoutes.js
│   │   │   ├── sharingRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── events/
│   │   │   ├── socket.js
│   │   │   └── eventNames.js
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── solver-engine/
│   ├── CMakeLists.txt
│   ├── include/
│   │   ├── cube/
│   │   │   ├── StickerCube.hpp
│   │   │   ├── PieceCube.hpp
│   │   │   └── CompactCube.hpp
│   │   ├── algorithms/
│   │   │   ├── BFS.hpp
│   │   │   ├── DFS.hpp
│   │   │   ├── IDDFS.hpp
│   │   │   └── IDAStar.hpp
│   │   ├── heuristics/
│   │   │   ├── Heuristic.hpp
│   │   │   ├── MisplacedPieces.hpp
│   │   │   ├── CornerEdgeLowerBound.hpp
│   │   │   └── PatternDatabase.hpp
│   │   ├── metrics/
│   │   │   └── SolveMetrics.hpp
│   │   └── protocol/
│   │       └── JsonLineProtocol.hpp
│   ├── src/
│   │   ├── cube/
│   │   ├── algorithms/
│   │   ├── heuristics/
│   │   ├── metrics/
│   │   └── protocol/
│   ├── tests/
│   │   ├── cube/
│   │   ├── algorithms/
│   │   ├── heuristics/
│   │   └── protocol/
│   ├── benchmarks/
│   └── README.md
│
├── docs/
│   ├── prd/
│   │   └── rubiks-cube-prd-v2.md
│   ├── trd/
│   │   └── rubiks-cube-trd-v2.md
│   ├── product/
│   │   ├── website-flow-v2.md
│   │   └── implementation-plan-v2.md
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── api-contract.md
│   │   └── solver-integration.md
│   ├── algorithms/
│   │   ├── bfs.md
│   │   ├── dfs.md
│   │   ├── iddfs.md
│   │   ├── ida-star.md
│   │   └── heuristics.md
│   └── deployment/
│       ├── local-development.md
│       ├── staging.md
│       └── production.md  
│
├── database/
│   ├── migrations/
│   │   ├── 001_profiles.sql
│   │   ├── 002_solve_jobs.sql
│   │   ├── 003_solve_results.sql
│   │   ├── 004_benchmarks.sql
│   │   ├── 005_shares.sql
│   │   ├── 006_audit_logs.sql
│   │   └── 007_rls_policies.sql
│   ├── functions/
│   ├── seed.sql
│   ├── policies.sql
│   └── README.md
│
├── infra/
│   ├── docker/
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   └── solver-engine.Dockerfile
│   ├── nginx/
│   │   └── nginx.conf
│   ├── monitoring/
│   └── scripts/
│
├── .github/
│   └── workflows/
│       ├── frontend.yml
│       ├── backend.yml
│       └── solver-engine.yml
│
├── docker-compose.yml
├── package.json
├── .gitignore
└── README.md

## 4. Cube Engine

Use a fixed face order and move enum in every service. Support 18 tokens: `U U' U2 D D' D2 L L' L2 R R' R2 F F' F2 B B' B2`.

Representations:

```cpp
struct StickerCube { std::array<uint8_t, 54> stickers; };
struct Corner { uint8_t permutation; uint8_t orientation; };
struct Edge { uint8_t permutation; uint8_t orientation; };
struct PieceCube { std::array<Corner,8> corners; std::array<Edge,12> edges; };
struct CompactCube { uint64_t cornerPermutation; uint32_t cornerOrientation; uint64_t edgePermutation; uint32_t edgeOrientation; };
```

Sticker model is for rendering/debugging; piece model is for logical moves; compact model is for search, hashing, and pattern indexes. Test `decode(encode(cube)) == cube`.

Move tables should be precomputed. Test each move with its inverse, four quarter turns, two half turns, known scrambles, and agreement between sticker and piece models.

## 5. Validation

Validate nine stickers per color, centers, unique corners/edges, corner orientation sum modulo 3, edge orientation sum modulo 2, and compatible permutation parity. Return structured errors such as `INVALID_CORNER_ORIENTATION`. Never search invalid states.

## 6. Algorithms

Common options:

```cpp
struct SolveOptions {
  Algorithm algorithm;
  HeuristicType heuristic;
  uint32_t maxDepth;
  uint64_t timeoutMs;
  uint64_t memoryLimitBytes;
  bool collectTrace;
  bool useTranspositionTable;
  bool enableMovePruning;
};
```

Metrics must include generated, expanded, pruned, duplicate nodes, maximum depth, threshold iterations, elapsed milliseconds, and peak memory.

- BFS uses queue + visited + parent reconstruction and is depth/memory limited.
- DFS uses bounded recursion/stack and move pruning; it is not shortest by default.
- IDDFS runs depth-limited DFS repeatedly and records repeated work.
- IDA* initializes threshold with `h(root)`, searches depth-first, prunes `g+h > threshold`, and uses the smallest exceeded cost as the next threshold.

Heuristics must expose name, admissibility, consistency, version, runtime, and memory. Pattern databases must be versioned and checksummed.

## 7. C++ Worker Protocol

MVP uses JSON Lines over stdin/stdout. Express or a worker manager sends:

```json
{"requestId":"job_1","cubeState":"...","algorithm":"IDA_STAR","heuristic":"CORNER_EDGE_LOWER_BOUND","maxDepth":30,"timeoutMs":30000,"collectTrace":false}
```

The worker returns:

```json
{"requestId":"job_1","status":"SOLVED","solution":["R","U_PRIME"],"metrics":{"nodesExpanded":1000,"nodesPruned":5000,"elapsedMs":8420},"solverVersion":"cpp-2.0.0"}
```

Progress messages may contain threshold, depth, elapsed time, nodes expanded, and nodes pruned. Failure statuses include `TIMEOUT`, `MEMORY_LIMIT`, `INVALID_STATE`, and `SOLVER_CRASHED`. Never expose raw stderr or stack traces.

## 8. Supabase Authentication

Create the browser client with Vite variables:

```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Email/password:

```js
await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
});
await supabase.auth.signInWithPassword({ email, password });
```

Google:

```js
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
});
```

Configure Google client credentials, authorized origins, callback URLs, email confirmation, SMTP, reset-password redirect, and production URLs in Supabase. The frontend must call `getSession()` on startup and subscribe through `onAuthStateChange`.

The browser may contain only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never expose `SUPABASE_SERVICE_ROLE_KEY` in Vite.

## 9. Express Authentication Middleware

For protected routes:

1. Read the `Authorization: Bearer <token>` header.
2. Validate the session through the Supabase server client.
3. Attach `user.id` to request context.
4. Enforce ownership and role checks.
5. Return `401` for missing/invalid sessions and `403` for insufficient permissions.

The service-role client may be used only in trusted Express/worker code and only after explicit authorization.

## 10. Supabase Schema and RLS

Supabase owns `auth.users`. Create application tables:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, avatar_url text,
  role text not null default 'USER' check (role in ('USER','ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.solve_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null, input_scramble text, normalized_scramble text,
  cube_state text not null, algorithm text not null, heuristic text,
  max_depth integer not null, timeout_ms bigint not null,
  collect_trace boolean not null default false,
  solver_version text, failure_code text,
  created_at timestamptz not null default now(),
  started_at timestamptz, completed_at timestamptz
);

create table public.solve_results (
  id uuid primary key default gen_random_uuid(),
  solve_job_id uuid unique not null references public.solve_jobs(id) on delete cascade,
  solution text[] not null default '{}', solution_length integer,
  nodes_generated bigint, nodes_expanded bigint, nodes_pruned bigint,
  duplicate_states bigint, max_depth_reached integer,
  threshold_iterations integer, elapsed_ms bigint,
  peak_memory_bytes bigint, cache_hit boolean,
  created_at timestamptz not null default now()
);
```

Also create `benchmark_suites`, `benchmark_cases`, `benchmark_results`, `shares`, and `audit_logs`. Enable RLS on every public table. Example:

```sql
alter table public.solve_jobs enable row level security;
create policy "own jobs" on public.solve_jobs
for select using (auth.uid() = user_id);
create policy "insert own jobs" on public.solve_jobs
for insert with check (auth.uid() = user_id);
```

Use separate policies for select/insert/update/delete. Public share reads must reveal only allowed fields. Admin access must use a protected role policy or trusted server operation.

## 11. REST API

```text
POST /api/v1/cube/parse
POST /api/v1/cube/validate
POST /api/v1/cube/scramble
POST /api/v1/solves
GET  /api/v1/solves/:id
POST /api/v1/solves/:id/cancel
GET  /api/v1/history/solves
POST /api/v1/benchmarks
GET  /api/v1/benchmarks/:id
GET  /api/v1/benchmarks/:id/results
POST /api/v1/solves/:id/share
GET  /api/v1/shared/:shareId
GET  /api/v1/admin/jobs
```

Create solve request:

```json
{"scramble":"R U R' F2","algorithm":"IDA_STAR","heuristic":"CORNER_EDGE_LOWER_BOUND","maxDepth":30,"timeoutMs":30000,"collectTrace":false}
```

Use a consistent error format with `code`, safe `message`, `details`, and `requestId`.

## 12. Jobs, Redis, and Realtime

For the current scope, Express invokes the C++ binary directly as a controlled child process; the Redis queue integration is deferred as a future scaling task. Job states are `CREATED`, `QUEUED`, `RUNNING`, `SOLVED`, `PERSISTING`, `COMPLETED`, `CANCELLED`, `TIMEOUT`, `MEMORY_LIMIT`, or `FAILED`.

Store short-lived progress under `job:{id}:progress`; cache results using cube hash + algorithm + heuristic + solver version + options. Do not cache incompatible configurations.

Socket.IO events: `solve:queued`, `solve:started`, `solve:progress`, `solve:completed`, `solve:failed`, `solve:cancelled`, `benchmark:progress`, and `benchmark:completed`. Fall back to polling if WebSocket connection fails.

## 13. Frontend Design

Use React Router pages for landing, auth, callback, solve, benchmark, history, result, docs, and admin. Maintain separate state for cube, forms, server data, UI, and authentication. Use Supabase auth state as the source for session state and a typed/validated API client for Express data.

Components:

```text
CubeNet, Cube3D, MoveToolbar, ScrambleInput, AlgorithmSelector,
HeuristicSelector, SolveControls, JobStatusCard, MetricsPanel,
SolutionPlayer, MoveList, SearchTracePanel, BenchmarkTable,
BenchmarkChart, HistoryTable, DocumentationPanel
```

The final replay state must be independently checked as solved. Provide keyboard navigation, sufficient contrast, non-color status labels, focus states, and reduced-motion support.

## 14. Environment and Deployment

```text
NODE_ENV=development
PORT=4000
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://localhost:6379
SOLVER_PATH=/app/bin/rubiks-solver
SOLVER_DEFAULT_TIMEOUT_MS=30000
SOLVER_DEFAULT_MAX_DEPTH=30
SOLVER_MAX_CONCURRENCY=2
CORS_ORIGIN=http://localhost:5173
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:4000
```

Use Vite at `localhost:5173`, Express at `localhost:4000`, and Supabase CLI for local database/auth services. The service-role key is never committed or exposed.

Production uses hosted Supabase, API containers, isolated C++ workers, a frontend static deployment, HTTPS, centralized logs, health checks, and independent scaling of API and workers. (Redis is deferred to future scaling).

## 15. Testing

C++ tests cover moves, inverses, encoding, validation, heuristics, queues, search termination, and solution verification. Backend tests cover Supabase auth middleware, ownership, RLS-compatible queries, jobs, callbacks, cancellation, rate limits, and idempotency. Frontend tests cover auth states, cube rendering, controls, replay, progress, and errors. Playwright covers registration, Google/email sign-in flows where testable, solve, replay, history, and sharing.

Benchmark tests must record hardware, OS, compiler, flags, solver version, representation, move metric, heuristic, seed, scramble, limits, and results.

## 16. Security and Reliability

Use Supabase-managed password security, OAuth state protections, HTTPS, strict input validation, RLS, server ownership checks, quotas, rate limits, worker isolation, process timeouts, memory limits, safe IPC, audit logs, and no secrets in client bundles. Make result persistence idempotent. Use safe error responses and correlation IDs.

## 17. CI/CD and Definition of Done

CI runs JavaScript lint/build/tests, C++ build/tests, API tests, frontend tests, migration checks, integration smoke tests, and Docker builds. Release builds use an optimized C++ binary, apply Supabase migrations, deploy frontend/API/workers, run health checks, and support rollback.

Done means: all 18 moves and validation pass; all algorithms return verified solutions for committed cases; email and Google auth work; RLS blocks cross-user access; jobs survive timeouts; UI replay works; benchmarks are reproducible; deployment and documentation work from a clean checkout.

## 18. Scaling

Add Redis-backed distributed workers, autoscaling by queue depth, versioned pattern-database artifacts, memory-mapped lookup tables, WebAssembly for small browser solves, camera input, distributed benchmark suites, symmetry reduction, factorial permutation ranking, two-phase solving, and larger cube support.
