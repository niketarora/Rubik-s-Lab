# Local Development

**Source:** TRD §§2, 3, 14
**Status:** Implementation-ready draft
**Date:** 2026-08-09

## 1. Prerequisites

- Node.js (ES2022+ compatible) and a package manager (npm/pnpm/yarn per `package.json` at repo root and in `frontend/`/`backend/`).
- C++17-or-later toolchain and CMake, for `solver-engine/`.
- GoogleTest or Catch2 available for solver-engine tests.
- Docker and Docker Compose (for optional containerized local services).
- Supabase CLI, for local Postgres + Auth emulation.
- Redis (deferred) — only required for the future scaling plan.

## 2. Repository Layout Recap

```text
rubiks-cube/
├── frontend/        React + Vite app
├── backend/         Express API
├── solver-engine/   C++ solver (CMake project)
├── docs/            this documentation tree
├── database/        Supabase migrations, policies, seed data
├── infra/           Docker, nginx, monitoring, scripts
├── .github/workflows/
└── docker-compose.yml
```

## 3. First-Time Setup

```bash
# 1. Clone and install JS workspaces
git clone <repo-url> rubiks-cube && cd rubiks-cube
npm install              # root
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Build the C++ solver
cd solver-engine
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
cd ..

# 3. Configure environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 4. Start local Supabase services
supabase start

# 5. Apply database migrations
supabase db reset   # or: run migrations in database/migrations/ in order
```

## 4. Environment Variables (TRD §14)

### Backend (`backend/.env`)

```text
NODE_ENV=development
PORT=4000
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://localhost:6379 # (future plan / optional)
SOLVER_PATH=/app/bin/rubiks-solver
SOLVER_DEFAULT_TIMEOUT_MS=30000
SOLVER_DEFAULT_MAX_DEPTH=30
SOLVER_MAX_CONCURRENCY=2
CORS_ORIGIN=http://localhost:5173
```

For local Supabase CLI usage, `SUPABASE_URL` typically points at the local emulator's URL (see `supabase status` for the exact values) rather than a hosted project.

### Frontend (`frontend/.env`)

```text
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:4000
```

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the frontend `.env` — Vite exposes any `VITE_*` variable to the browser bundle, and the service-role key must remain server/worker-only (TRD §8).

## 5. Running the Stack Locally

```bash
# Terminal 1 — frontend
cd frontend && npm run dev            # http://localhost:5173

# Terminal 2 — backend
cd backend && npm run dev             # http://localhost:4000

# Terminal 3 — Supabase local stack (already started via `supabase start`)
supabase status                        # confirm local URL/keys

# Terminal 4 — Redis (future plan, optional)
# redis-server                           # or: docker compose up redis
```

During Phases 1–3 of the implementation plan, `solver-engine`'s CLI can be exercised directly without the web stack running at all:

```bash
./solver-engine/build/rubiks-solver-cli --scramble "R U R' F2" --algorithm IDA_STAR
```

During Phase 4, point the backend's `solverService` at `mockSolverService.js` (no C++ binary required) via config/env flag until `cppSolverService.js` integration (Phase 6) is ready.

## 6. Running Tests

```bash
# Solver engine
cd solver-engine && cmake --build build --target test   # or: ctest --test-dir build

# Backend
cd backend && npm test

# Frontend unit/component tests
cd frontend && npm run test           # Vitest + React Testing Library

# End-to-end
cd frontend && npm run test:e2e       # Playwright
```

## 7. Optional: Docker Compose for Local Services

`docker-compose.yml` at the repo root can bring up backend, frontend, and solver-engine as containers for a closer-to-production local environment (Redis is optional/deferred):

```bash
docker compose up --build
```

Use `infra/docker/frontend.Dockerfile`, `backend.Dockerfile`, and `solver-engine.Dockerfile` as the respective build contexts. Local Supabase remains managed by the Supabase CLI rather than `docker-compose.yml` unless explicitly added.

## 8. Common Local Development Pitfalls

- Forgetting to rebuild `solver-engine` after C++ changes — the backend calls whatever binary exists at `SOLVER_PATH`, so a stale binary silently produces stale results.
- Running the frontend against a hosted Supabase project's anon key while the backend points at local Supabase (or vice versa) — `SUPABASE_URL`/`VITE_SUPABASE_URL` must refer to the same project in every environment.
- Leaving `SOLVER_MAX_CONCURRENCY` too high on a laptop, causing many simultaneous C++ processes to contend for CPU during benchmark-suite testing.
- Testing Google OAuth locally requires a registered redirect URL matching `http://localhost:5173/auth/callback` in the Google/Supabase Auth provider configuration — see `docs/architecture/system-architecture.md` §2.3 and TRD §8.
