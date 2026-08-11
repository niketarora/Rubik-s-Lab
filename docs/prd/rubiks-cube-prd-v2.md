# Product Requirements Document (PRD)

# Rubik's Cube Algorithm Laboratory — Version 2

**Status:** Implementation-ready draft  
**Date:** 2026-08-09  
**Product:** Full-stack Rubik’s Cube solving, visualization, and benchmarking platform

## 1. Vision

Build a polished web laboratory where users can enter or generate a 3×3 Rubik’s Cube scramble, solve it with BFS, DFS, IDDFS, or Korf’s IDA\*, watch the solution replay, and compare algorithm performance. The product must make the DSA visible: users should see the algorithm, heuristic, thresholds, nodes explored, nodes pruned, execution time, memory, and solution length.

The project combines a high-performance C++ solver engine with a JavaScript full-stack application:

```text
React + Vite frontend -> Node.js + Express API -> C++ solver worker
                                  |
                         Supabase database/auth
                                  |
                         Redis queue/cache (future plan)
```

## 2. Problem

A command-line solver proves that a solution exists but does not explain the search or provide a useful experience. Beginners cannot see why BFS consumes memory, why IDDFS repeats work, or how IDA\* uses a heuristic to prune branches. The product solves this by combining a visual cube, reproducible scrambles, algorithm comparison, benchmark history, documentation, and a deployable full-stack architecture.

## 3. Goals

- Accept valid standard cube notation and generate reproducible scrambles.
- Render and manipulate the cube accurately.
- Implement and compare BFS, DFS, IDDFS, and IDA\*.
- Include admissible heuristics and explain their tradeoffs.
- Report solution, timing, memory, nodes, thresholds, and pruning metrics.
- Support email/password and Google sign-in through Supabase Auth.
- Save user solves and benchmarks in Supabase Postgres.
- Keep expensive searches asynchronous and cancellable.
- Provide a responsive, accessible, portfolio-quality UI.

## 4. Non-goals for MVP

- Competition-grade instant solving for every arbitrary state.
- Camera recognition.
- 4×4 or larger cubes.
- Multiplayer manipulation.
- Guaranteed optimal solutions when a non-admissible heuristic is selected.
- Storing every explored search node permanently.

## 5. Users and Roles

### Guest

Can read documentation, generate scrambles, manipulate a cube, and run restricted solves. Guest requests are rate-limited and are not saved as personal history.

### Registered user

Can sign in with email/password or Google, save solves, run benchmarks within quotas, replay solutions, and create public share links.

### Administrator

Can inspect workers and jobs, cancel expensive jobs, manage limits, view aggregate system metrics, and manage solver versions.

## 6. Main User Journeys

### Solve a scramble

1. User opens Solver.
2. User enters a scramble or generates one.
3. Application parses and validates it.
4. User selects algorithm, heuristic, depth, timeout, and trace settings.
5. API creates a job.
6. Solver executes and emits progress.
7. User sees the solution and metrics.
8. User replays the moves on the cube.
9. Authenticated user saves or shares the result.

### Compare algorithms

1. User selects one scramble.
2. User selects two or more algorithms.
3. System creates comparable child jobs with the same state and limits.
4. Results are aggregated.
5. Charts compare success, time, solution length, visited nodes, pruned nodes, and memory.

### Authenticate

The sign-in page provides:

- Email/password sign-up.
- Email/password sign-in.
- Password reset.
- Email confirmation handling.
- **Continue with Google** using Supabase OAuth.
- Session restoration after refresh.
- Logout.

## 7. Functional Requirements

### FR-001 Authentication

Use Supabase Auth. Support email/password and Google OAuth. The frontend must show loading, confirmation-pending, reset-password, OAuth failure, expired-session, and logout states. A profile row is created for each `auth.users.id`.

### FR-002 Authorization

Protected API routes require a valid Supabase bearer token. Server-side ownership checks must ensure users can only read, update, delete, or share their own records. Admin permissions must be checked on the backend.

### FR-003 Scramble input

Support `U U' U2 D D' D2 L L' L2 R R' R2 F F' F2 B B' B2`. Normalize whitespace, reject invalid tokens, show the normalized sequence, and produce deterministic states.

### FR-004 Random scramble

Generate configurable scrambles, avoid consecutive moves on the same face, store the seed where reproducibility is required, and validate the resulting state.

### FR-005 Cube editing

Provide move buttons, undo, redo, reset, and optional keyboard shortcuts. Every move must update the internal state and visual state consistently.

### FR-006 Cube validation

Check color counts, centers, unique corners and edges, corner orientation parity, edge orientation parity, and permutation parity. Explain failures in plain language.

### FR-007 Algorithm selection

Support BFS, DFS, IDDFS, and IDA\*. Explain strengths, memory tradeoffs, shortest-path guarantees, and recommended scramble ranges.

### FR-008 Heuristics

Support a basic misplaced-piece heuristic, corner/edge lower bounds, and a versioned pattern database when enabled. Display admissibility and optimality status.

### FR-009 Solve jobs

Accept cube state, algorithm, heuristic, maximum depth, timeout, memory limit, move-pruning flag, transposition-table flag, and trace flag. Reject unsafe configurations before execution.

### FR-010 Progress

Show queued/running/completed/failed/cancelled state, elapsed time, current depth, IDA\* threshold, generated/expanded/pruned nodes, current best solution if available, and queue wait time.

### FR-011 Results

Return scramble, normalized state, algorithm, heuristic, solution, length, elapsed time, generated/expanded/pruned/duplicate nodes, maximum depth, threshold iterations, peak memory, cache status, solver version, and timestamps.

### FR-012 Replay

Provide play, pause, next, previous, restart, speed, and jump-to-move controls. Verify the final replay state is solved. Support reduced-motion mode.

### FR-013 Visualization

MVP uses a 2D cube net. Version 2 may include React Three Fiber/Three.js 3D rendering. Both must use the same normalized state conversion.

### FR-014 Benchmarking

Create suites with scrambles, random seed, algorithm list, heuristics, timeout, depth, and concurrency. Report mean, median, min, max, p95, standard deviation, success rate, timeout rate, average solution length, nodes, and memory.

### FR-015 History

Authenticated users can search, filter, sort, open, replay, share, and delete their own solve and benchmark history.

### FR-016 Sharing

Create read-only, optionally expiring public links containing only explicitly shareable fields. Do not expose email, tokens, or private metadata.

### FR-017 Documentation

Explain notation, state models, moves, BFS, DFS, IDDFS, A*, IDA*, heuristics, pattern databases, complexity, memory, benchmark methodology, and limitations.

### FR-018 Administration

Admins can view/cancel jobs, see worker health, configure quotas, inspect audit events, and manage solver versions.

## 8. Algorithm Requirements

A cube state is a graph node and a legal move is an edge. Use sticker representation for visualization, piece representation for logical operations, and compact encoding for hashing/search.

- **BFS:** queue and visited map; shortest by move count; enforce memory/depth limits.
- **DFS:** depth-limited recursion/stack; low memory; no shortest guarantee by default.
- **IDDFS:** repeated depth-limited DFS; shortest-depth guarantee with repeated work.
- **IDA\*:** threshold starts at `h(root)`; prune when `g + h > threshold`; next threshold is the minimum exceeded cost; repeat until solved or limited.
- **Heuristics:** must declare admissibility, consistency where known, runtime, memory, and version.
- **Pruning:** inverse moves, same-face redundancies, move ordering, duplicate-state detection, and optional transposition tables.
- **Pattern database:** versioned, checksummed, representation-compatible lower-bound artifact.

A valid returned solution must be applied independently to the input state before being marked successful.

## 9. UI Requirements

Pages:

- Landing page.
- Sign-in/sign-up/OAuth callback/reset pages.
- Solver workspace.
- Benchmark workspace.
- History.
- Result details.
- Documentation.
- Dashboard.

The solver layout should include cube visualizer, scramble control, algorithm panel, solution player, live metrics, and error/status messages. Use keyboard navigation, sufficient contrast, labels beyond color, and reduced motion.

## 10. Supabase Requirements

Supabase is the source of truth for authentication and application persistence. Use `auth.users` for identity and `public.profiles` for application data. Enable RLS on all public tables.

Email flow uses `signUp`, `signInWithPassword`, email confirmation, and password reset. Google flow uses `signInWithOAuth({ provider: 'google' })` with configured redirect URLs. The browser receives only the Supabase URL and anonymous key. The service-role key is server/worker-only.

RLS must allow users to access their own rows, allow carefully scoped public share reads, and restrict admin operations. The Express server must validate the bearer token and repeat ownership checks even when a trusted service client is used.

## 11. Performance and Security

Initial targets: API validation under 300 ms, job submission under 500 ms, progress delay under 1 second, responsive cube animation, and no unbounded trace storage. Actual solver performance must be reported with hardware, compiler, representation, heuristic, scramble, and version.

Use password security through Supabase, HTTPS, strict validation, rate limits, quotas, worker isolation, safe C++ IPC, no shell concatenation, protected secrets, audit logs, and safe error messages.

## 12. Roadmap

1. Correct cube state and move engine.
2. BFS, DFS, IDDFS and CLI metrics.
3. IDA\*, heuristic, pruning, and hashing.
4. React/Vite UI and Express API.
5. Supabase Auth, profiles, RLS, history, and results.
6. C++ worker integration.
7. In-process benchmarks and Socket.IO progress (Redis queue deferred to future).
8. 3D cube, pattern database, WebAssembly, camera input, distributed benchmarking, and Redis queue scaling.

## 13. Definition of Done

The release is done when all move invariants, state validation, algorithm tests, solution verification, auth flows, RLS policies, API tests, frontend replay tests, job limits, Docker setup, benchmark metadata, documentation, screenshots, and deployed smoke tests pass.
