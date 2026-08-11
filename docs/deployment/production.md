# Production Deployment

**Source:** TRD §§14, 16, 17, PRD §11
**Status:** Implementation-ready draft
**Date:** 2026-08-09

## 1. Topology

```text
Frontend    Vercel static deployment behind HTTPS
API         containerized, independently scalable (horizontal)
Workers     isolated C++ worker containers (directly spawned by API for now, Redis-queued in future)
Supabase    hosted project (managed Postgres, Auth, RLS)
Redis       (future plan) managed instance
```

The API and worker tiers scale independently (TRD §14) because solve/benchmark jobs are CPU-bound and bursty, while API traffic (auth, history, share reads) is comparatively steady and latency-sensitive. Coupling their scaling would either starve API responsiveness during heavy benchmark load or over-provision API capacity to cover worker spikes.

## 2. Environment Configuration

```text
NODE_ENV=production
SUPABASE_URL=https://<production-project>.supabase.co
SUPABASE_ANON_KEY=<production anon key>
SUPABASE_SERVICE_ROLE_KEY=<production service-role key>   # server/worker only, never in frontend
REDIS_URL=<managed redis url> (future plan / optional)
SOLVER_PATH=/app/bin/rubiks-solver
SOLVER_DEFAULT_TIMEOUT_MS=30000
SOLVER_DEFAULT_MAX_DEPTH=30
SOLVER_MAX_CONCURRENCY=<sized per worker container resources>
CORS_ORIGIN=https://<production domain>
VITE_SUPABASE_URL=https://<production-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<production anon key>
VITE_API_BASE_URL=https://api.<production domain>
```

`SUPABASE_SERVICE_ROLE_KEY` exists only in the API/worker runtime environment (injected via the deployment platform's secret manager), never in any client-shipped bundle or `VITE_*` variable (TRD §8).

## 3. Release Process (CI/CD, TRD §17)

```text
1. CI on the release branch: JS lint/build/tests, C++ build/tests, API tests,
   frontend tests, migration checks, integration smoke tests, Docker builds.
2. Build the C++ solver as an optimized release binary (Release build type,
   not the debug build used in local development).
3. Apply pending Supabase migrations (database/migrations/*.sql) to the
   production project — forward-only, reviewed migrations; no destructive
   changes without an explicit backward-compatible rollout plan.
4. Deploy frontend to Vercel, API containers, and worker containers.
5. Run health checks on API and worker tiers before routing production traffic
   to the new version.
6. Run post-deploy smoke tests against production endpoints.
7. Support rollback: keep the previous API/worker container images and the
   previous frontend build available for immediate redeploy if health checks
   or smoke tests fail post-cutover.
```

## 4. Security Requirements at Deploy Time (TRD §16)

- HTTPS enforced everywhere; no plaintext fallback for API or WebSocket traffic.
- Supabase-managed password security and OAuth state protections rely on correctly configured production redirect URLs and authorized origins in the Supabase Auth and Google OAuth consoles.
- RLS is enabled on every public table in the production Postgres instance — this is verified as part of the migration checks, not assumed.
- Server-side ownership checks in Express are exercised even when a trusted service-role client is used internally (defense in depth beyond RLS).
- Rate limits and per-user/guest quotas are active in production (they may be relaxed or disabled in local/staging for testing).
- Worker isolation: each C++ solver invocation runs in its own process/container with enforced timeout and memory limits; a crashed or hung solver cannot affect the API process or other jobs.
- The C++ binary is invoked with an argv array, never a concatenated shell string (no shell injection surface).
- Audit logs capture admin actions (job cancellation, quota changes, solver version changes) and are retained per the org's log retention policy.
- Error responses returned to clients never include raw stack traces, solver stderr, or internal error messages — only mapped `code`/safe `message`/`requestId` (see `docs/architecture/api-contract.md` §1).

## 5. Performance Targets in Production (PRD §11)

| Target | Value |
|---|---|
| API validation | < 300 ms |
| Job submission | < 500 ms |
| Progress delay (Socket.IO/polling) | < 1 s |
| Trace storage | bounded — no unbounded trace retention |

These are monitored continuously (see §7) rather than checked only at deploy time, since they can regress under load even without a code change (e.g. Redis latency drift, worker contention).

## 6. Scaling Guidance

- **API tier:** scale horizontally behind a load balancer based on request latency/throughput.
- **Worker tier:** (Future plan: scale by `queue:solve`/`queue:benchmark` depth using Redis). Currently, limit execution concurrency per API container via `SOLVER_MAX_CONCURRENCY` to fit available CPU/memory.
- **Redis:** (Future plan) size for the combined load of job queues, `job:{id}:progress` documents, and the result cache.
- **Supabase:** monitor Postgres connection usage from the API tier; use connection pooling appropriate to the hosting plan.

## 7. Observability and Health Checks

- Centralized structured logs (Pino/Winston) from API and worker containers, correlated by `requestId` across the API → worker → Supabase path.
- Health check endpoints on both API and worker tiers used by the deployment platform to gate traffic cutover and to drive autoscaling/restarts.
- Dashboards/alerts on: job failure rate by `failureCode` (`TIMEOUT`, `MEMORY_LIMIT`, `INVALID_STATE`, `SOLVER_CRASHED`), queue depth and wait time, API latency against the §5 targets, and RLS-denial rates (a spike may indicate a client bug or an attempted authorization bypass).

## 8. Rollback

Because migrations are forward-only and reviewed for backward compatibility, rolling back the application containers to the previous image version should not require a corresponding database rollback in the common case. If a migration is not backward-compatible with the previous application version, the release process must explicitly document and test the rollback path before the migration is applied in production.

## 9. Definition of Done for a Production Release (PRD §13, TRD §17)

A release is production-ready when: all move invariants and state validation pass; all algorithms return verified solutions for committed test cases; email and Google auth work end-to-end against production configuration; RLS blocks cross-user access; jobs survive timeouts without corrupting job state; UI replay works and independently verifies the solved state; benchmarks are reproducible; and the full deployment — frontend, API, workers, migrations — succeeds from a clean checkout with passing smoke tests.
