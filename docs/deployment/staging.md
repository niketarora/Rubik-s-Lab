# Staging Deployment

**Source:** TRD §§14, 17, PRD §11
**Status:** Implementation-ready draft
**Date:** 2026-08-09

## 1. Purpose

Staging is a production-like environment used to validate a release candidate — real hosted Supabase project (separate from production), containerized API/worker images, and CI-built artifacts — before promotion to production. It is where Definition of Done items that require a deployed environment (PRD §13, TRD §17: "deployment and documentation work from a clean checkout") are actually exercised.

## 2. Topology

```text
Frontend    Vercel static deployment, staging domain, HTTPS
API         containerized, single instance (scaling not required in staging)
Workers     isolated C++ worker container(s) (spawned by API for now, Redis-queued in future)
Supabase    dedicated staging project (managed Postgres, Auth, RLS) — never shares
            data with production
Redis       (future plan) managed or containerized instance, staging-scoped
```

Staging mirrors production's topology (TRD §14: "hosted Supabase, API containers, isolated C++ workers, optional Redis, a frontend static deployment, HTTPS, centralized logs, health checks, independent scaling") minus the scaling breadth — one instance per tier is sufficient unless load-testing scaling behavior specifically.

## 3. Environment Configuration

Same variable set as production (see `docs/deployment/production.md`), pointed at staging-specific values:

```text
NODE_ENV=staging
SUPABASE_URL=https://<staging-project>.supabase.co
SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service-role key>   # server/worker only
REDIS_URL=<staging redis url> (future plan / optional)
SOLVER_PATH=/app/bin/rubiks-solver
CORS_ORIGIN=https://staging.<domain>
VITE_SUPABASE_URL=https://<staging-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging anon key>
VITE_API_BASE_URL=https://api-staging.<domain>
```

- Google OAuth requires its own staging redirect URL registered separately from production's (`https://staging.<domain>/auth/callback`).
- Staging secrets are managed the same way as production secrets (see §6) — never reused from local `.env` files, never committed.

## 4. Deployment Flow

```text
1. CI (GitHub Actions) builds and tests on merge to the release branch:
     - frontend.yml   → lint, unit tests, build
     - backend.yml    → lint, unit tests, integration tests against a Supabase test project
     - solver-engine.yml → CMake build, GoogleTest/Catch2 suite
2. On success, build and push container images:
     - Vercel build (or static build artifact to CDN)
     - infra/docker/backend.Dockerfile
     - infra/docker/solver-engine.Dockerfile
3. Apply pending Supabase migrations (database/migrations/*.sql, in order) to the
   staging project via Supabase CLI/migration runner.
4. Deploy images to the staging container platform.
5. Run health checks against the API and worker tiers.
6. Run the automated smoke-test suite (Playwright: registration, sign-in, a representative
   solve, replay, history, sharing).
```

## 5. What Staging Validates Before Production

- Real Supabase Auth flows (email confirmation, Google OAuth) against real redirect URLs — not achievable with the Supabase CLI's local emulator alone.
- RLS policies against a real hosted Postgres instance, including cross-user isolation checks.
- The full C++ worker container boundary (build, isolation, timeout/memory enforcement) rather than a locally built binary.
- Redis-backed queueing, progress, and caching behavior (deferred for future scaling).
- End-to-end smoke tests that exercise the same routes and Socket.IO events used in production.

## 6. Secrets Management

- `SUPABASE_SERVICE_ROLE_KEY`, OAuth client secrets, and any solver-related secrets are stored in the CI/CD platform's secret store and injected at deploy time — never committed to the repository, never present in the frontend bundle (TRD §8, §16).
- Staging secrets are distinct from production secrets so a staging compromise cannot affect production data.

## 7. Data Hygiene

- Staging Supabase project uses seed data (`database/seed.sql`) rather than any copy of production user data.
- Periodically reset staging data to a known state to keep smoke tests deterministic and to avoid staging becoming a de facto second production dataset.

## 8. Promotion Criteria

A release candidate is promoted from staging to production only after:

- All CI checks (JS lint/build/tests, C++ build/tests, migration checks, Docker builds) pass.
- The Playwright smoke suite passes against staging.
- Manual or automated verification that RLS blocks cross-user access on the staging project.
- No unresolved `SOLVER_CRASHED`/`MEMORY_LIMIT` regressions in staging solve/benchmark runs compared to the previous release.

See `docs/deployment/production.md` for the production-specific configuration and rollout process.
