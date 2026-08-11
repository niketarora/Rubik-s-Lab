# Website Flow Document — Rubik’s Cube Algorithm Laboratory

**Version:** 2.0  
**Frontend:** JavaScript, React, Vite  
**Backend:** JavaScript, Node.js, Express  
**Authentication/database:** Supabase Auth and Supabase Postgres  
**Solver:** C++ engine through Express/worker integration

## 1. Flow Principles

The website is an algorithm laboratory, not only a solver. Every important action must be visible, explainable, reversible where possible, and associated with a clear loading, empty, error, or success state.

Primary navigation:

```text
Landing
├── Solve
├── Compare
├── Documentation
├── Sign in / Sign up
└── Authenticated menu
    ├── Dashboard
    ├── History
    ├── Benchmarks
    ├── Profile
    └── Sign out
```

Admin navigation is visible only to administrators:

```text
Admin
├── Jobs
├── Workers
├── System metrics
├── Solver versions
└── Configuration
```

## 2. Global Navigation

### Desktop header

- Logo: navigates to Landing.
- Solve: navigates to Solver Workspace.
- Compare: navigates to Benchmark Workspace.
- Learn: opens Documentation.
- History: visible for signed-in users.
- Dashboard: visible for signed-in users.
- Sign in: visible for guests.
- Avatar/menu: visible for authenticated users.
- Admin: visible only to administrators.

### Mobile navigation

Use a menu drawer. The drawer includes all public links, authenticated links, profile, and sign out. Closing the drawer returns the user to the current page.

### Global behavior

- Preserve the current unsaved cube state when navigating within the solver flow.
- Warn before leaving a page with an active unsaved benchmark or running job.
- Show a global toast for non-blocking success and error messages.
- Use a full-page error boundary for unexpected frontend failures.
- Display a loading shell while Supabase session state is being restored.

## 3. Routes and Access

| Route | Screen | Guest | User | Admin |
|---|---|---:|---:|---:|
| `/` | Landing | Yes | Yes | Yes |
| `/solve` | Solver workspace | Yes | Yes | Yes |
| `/compare` | Algorithm comparison | Limited | Yes | Yes |
| `/docs` | Documentation | Yes | Yes | Yes |
| `/auth/sign-in` | Sign in | Yes | Redirect | Redirect |
| `/auth/sign-up` | Sign up | Yes | Redirect | Redirect |
| `/auth/callback` | OAuth/email callback | Yes | Yes | Yes |
| `/auth/reset-password` | Reset password | Yes | Yes | Yes |
| `/dashboard` | User dashboard | No | Yes | Yes |
| `/history` | Solve history | No | Yes | Yes |
| `/benchmarks` | Saved benchmarks | No | Yes | Yes |
| `/solve/:id` | Result details | Owner/public | Owner | Admin |
| `/share/:token` | Public result | Yes | Yes | Yes |
| `/profile` | Profile/settings | No | Yes | Yes |
| `/admin` | Admin overview | No | No | Yes |
| `/admin/jobs` | Job management | No | No | Yes |
| `/admin/workers` | Worker health | No | No | Yes |
| `/404` | Not found | Yes | Yes | Yes |

Unauthenticated users may solve only within configured limits. Protected route redirects must preserve the original path so the user returns to it after sign-in.

## 4. Landing Page Flow

### Purpose

Explain the project and send users toward solving, comparing, or learning.

### Sections

- Hero: “Explore how algorithms solve a Rubik’s Cube.”
- Primary CTA: **Try the Solver** → `/solve`.
- Secondary CTA: **Compare Algorithms** → `/compare`.
- Interactive sample cube.
- Supported algorithms: BFS, DFS, IDDFS, IDA*.
- Metrics explanation.
- Architecture/technology summary.
- Short benchmark preview.
- Documentation CTA.
- Footer with repository, documentation, terms, and privacy links.

### Button behavior

- `Try the Solver`: create no job; navigate to a clean solver state.
- `Compare Algorithms`: navigate to comparison with a sample scramble.
- `Learn How It Works`: navigate to `/docs#algorithms`.
- `View Demo Result`: open a seeded public result.

### States

- Loading: show skeleton for benchmark preview.
- Empty: if no public benchmark exists, show “Benchmarks will appear here after the first run.”
- Error: keep the landing page usable if the preview API fails; show a retry button.

## 5. Authentication Flow

### Sign-up screen

Fields:

- Name.
- Email.
- Password.
- Confirm password.
- Terms checkbox.

Buttons:

- `Create account`: validate fields, call Supabase `signUp`, and show confirmation state.
- `Continue with Google`: start Supabase Google OAuth.
- `Already have an account? Sign in`: navigate to sign-in.

Validation:

- Required fields cannot be blank.
- Email must be valid.
- Passwords must match.
- Password must meet the configured Supabase policy.

Success state:

> Account created. Check your email to confirm your account.

If email confirmation is disabled, navigate to Dashboard or the originally requested route.

Errors:

- Existing email: explain that the email may already be registered.
- Weak password: show requirements.
- Network failure: preserve entered email/name and offer retry.
- OAuth failure: show a safe message and return to sign-in.

### Sign-in screen

Fields:

- Email.
- Password.
- Remember/session option if supported.

Buttons:

- `Sign in`: call `signInWithPassword`.
- `Continue with Google`: call `signInWithOAuth({ provider: 'google' })`.
- `Forgot password?`: navigate to reset screen.
- `Create account`: navigate to sign-up.

Success:

- Restore the Supabase session.
- Load/create `profiles` row.
- Redirect to the requested destination or Dashboard.
- Show a welcome toast.

Errors:

- Invalid credentials.
- Unconfirmed email with resend-confirmation action.
- Rate limit.
- Disabled account.
- Network failure.

### Google callback

1. Supabase redirects to `/auth/callback`.
2. Frontend waits for session restoration.
3. Retrieve user identity.
4. Create or update profile through the backend/Supabase trigger.
5. Redirect to the stored destination.
6. If no destination exists, go to Dashboard.

### Password reset

1. User enters email.
2. Supabase sends reset email.
3. User follows link to `/auth/reset-password`.
4. User enters and confirms a new password.
5. Supabase updates the password.
6. Redirect to Sign in with success message.

### Sign out

- Open avatar menu.
- Click `Sign out`.
- Confirm only if there is an active job or unsaved work.
- Call `supabase.auth.signOut()`.
- Clear user-specific cached data.
- Navigate to Landing.

## 6. Solver Workspace Flow

### Layout

```text
Header
├── Cube workspace
│   ├── 2D cube net / 3D cube
│   ├── move toolbar
│   └── undo/redo/reset
├── Input panel
│   ├── scramble text field
│   ├── generate scramble
│   ├── validate
│   └── apply
├── Solver configuration
│   ├── algorithm
│   ├── heuristic
│   ├── depth/time/memory limits
│   └── optimization flags
├── Job/progress panel
├── Result metrics
└── Solution player
```

### Initial state

- Cube is solved.
- Scramble field is empty.
- Algorithm defaults to IDA*.
- Basic admissible heuristic is selected.
- Solve button is enabled only after valid input or a generated scramble.
- A short “How it works” panel is visible.

### Enter scramble flow

1. User types a scramble.
2. Debounced parser checks notation.
3. Invalid token is underlined and explained.
4. User clicks `Apply scramble`.
5. Backend or shared validator checks the resulting state.
6. Cube updates only after validation succeeds.

Buttons:

- `Apply scramble`: parse, validate, update cube.
- `Generate scramble`: generate using selected length/seed.
- `Clear`: return to solved state and clear field.
- `Validate`: run physical-state validation.
- `Undo`/`Redo`: update move history.
- `Reset`: confirm if a non-solved state exists, then restore solved state.

### Algorithm configuration

Algorithm dropdown options:

- BFS: shortest path for manageable shallow cases, high memory.
- DFS: low memory, no shortest guarantee by default.
- IDDFS: low memory and shortest-depth search, repeated work.
- IDA*: heuristic-guided search, recommended for deeper cases.

Heuristic dropdown is enabled for IDA* and disabled or hidden for algorithms that do not use it. Show admissibility, expected memory, and recommended depth.

Advanced options:

- Maximum depth.
- Timeout.
- Memory limit.
- Move pruning.
- Transposition table.
- Collect trace.

### Start solve

1. User clicks `Solve cube`.
2. Frontend performs client validation.
3. API validates again.
4. API creates a job.
5. Button changes to `Cancel solve`.
6. Status changes to Queued, then Running.
7. Progress arrives through Socket.IO; polling is fallback.
8. Completion navigates to result section or `/solve/:id`.

Do not navigate away automatically if the user has configured a comparison or has unsaved edits; show a completion notification and a `View result` action.

### Progress states

- **Queued:** show queue position if available.
- **Running:** show elapsed time, threshold, depth, nodes, and progress animation.
- **Cancelling:** disable duplicate actions.
- **Cancelled:** show partial metrics and `Run again`.
- **Timeout:** explain the limit and offer a larger limit or easier algorithm.
- **Memory limit:** explain memory protection and suggest IDA*.
- **Failed:** show safe message, request ID, and retry.

### Result state

Show:

- Solved badge.
- Move sequence.
- Copy solution.
- Replay.
- Algorithm and heuristic.
- Solution length.
- Time.
- Generated/expanded/pruned/duplicate nodes.
- Threshold iterations.
- Maximum depth.
- Memory.
- Solver version.
- Benchmark conditions.

Buttons:

- `Replay solution`: open player and animate.
- `Copy moves`: copy standard notation and show toast.
- `Save result`: authenticated users save; guests are asked to sign in.
- `Share`: create public link after confirmation.
- `Compare this scramble`: navigate to Compare with the current state.
- `Solve another`: reset workspace after optional confirmation.

## 7. Solution Player Flow

Controls:

- Play/pause.
- Previous move.
- Next move.
- Restart.
- Speed selector.
- Move slider.

For every move, show `Move 4 of 13`, notation, and the updated cube. At the final move, verify solved state and show a success badge. If replay verification fails, show a technical error and do not claim success.

Empty state: “Solve a cube to see the move-by-move replay.”

## 8. Compare/Benchmark Flow

### Setup screen

- Current cube/scramble.
- Algorithm multi-select.
- Heuristic options per algorithm.
- Number of random cases.
- Scramble depth.
- Seed.
- Timeout and memory limit.
- Parallelism limit.

Buttons:

- `Add algorithm`.
- `Generate test set`.
- `Start benchmark`.
- `Reset configuration`.

Validation:

- At least two algorithms for comparison.
- At least one test case.
- Safe limits.
- Same scramble set for all algorithms.

### Benchmark progress

Show suite status, completed/total cases, active jobs, cancellations, failures, and estimated completion only when calculated from actual data.

### Benchmark results

Provide table and charts for success rate, median/mean/p95 time, solution length, nodes expanded, pruning ratio, memory, and timeout count. Allow algorithm filtering and case drill-down.

Buttons:

- `Open case`: view individual solve.
- `Run again`: duplicate configuration with a new run ID.
- `Save benchmark`: authenticated users only.
- `Export CSV/JSON`: optional future feature.
- `Share report`: create read-only report.

Empty state: “Configure at least two algorithms to compare.”
Error state: partial results remain visible; failed cases are labeled, not silently removed.

## 9. Dashboard Flow

For authenticated users, Dashboard shows:

- Total solves.
- Successful solves.
- Average time.
- Best solution length.
- Recent history.
- Favorite algorithm.
- Benchmark summary.

Empty state for a new user:

> You have no solves yet. Generate your first scramble.

CTA → `/solve`.

## 10. History Flow

Filters:

- Algorithm.
- Heuristic.
- Status.
- Date range.
- Scramble text.

Each row shows scramble, algorithm, result, time, length, and date. Clicking opens details. Delete requires confirmation and removes the user's record through an authorized request.

Loading uses a table skeleton. Empty state offers `Solve your first cube`. Pagination or infinite scroll must not load all history at once.

## 11. Profile Flow

Show name, email, avatar/provider, account creation date, and preferences. Users can update display name and avatar if supported. Email/provider identity is read-only unless changed through Supabase-supported flows. Include password reset and sign-out actions.

## 12. Admin Flow

Admin overview shows running jobs, queue depth, failures, worker CPU/memory, and recent alerts.

Jobs page actions:

- Filter by status/user/algorithm.
- Open details.
- Cancel running job.
- Retry safe failures.

Workers page shows online/offline, version, supported heuristics, current job, and heartbeat. Configuration page edits quotas, maximum depth, timeout, and concurrency. Every admin action creates an audit record.

## 13. Empty, Loading, Error, and Success Catalog

### Empty states

- No history: first-solve CTA.
- No benchmarks: configure algorithms CTA.
- No result: solve a cube CTA.
- No public preview: neutral placeholder.
- No admin jobs: “No active jobs.”
- No search matches: clear filters CTA.

### Loading states

- Initial auth restoration: page shell.
- Cube validation: disabled action with spinner.
- Job queued: status card.
- History: skeleton rows.
- Benchmark: progress table.
- Share creation: button spinner.

### Error states

- Invalid notation.
- Impossible physical state.
- Supabase authentication failure.
- Expired session.
- Unauthorized route.
- Network failure.
- Rate limit.
- Solver timeout.
- Memory limit.
- Worker crash.
- Database failure.
- WebSocket failure with polling fallback.
- Unknown frontend error boundary.

Every error must include a plain-language message, a next action, and no secrets or stack traces.

### Success states

- Account created.
- Email confirmation sent.
- Google sign-in complete.
- Scramble applied.
- Cube solved.
- Result saved.
- Link copied.
- Share created.
- Benchmark completed.
- Profile updated.
- Job cancelled.

## 14. Payment/Upgrade Flow

No payment or upgrade is required for the initial project. All features are free within quotas. The product may later add an optional Pro tier for longer timeouts, larger benchmark suites, pattern databases, exports, or priority workers.

If introduced later:

1. User opens Upgrade.
2. Pricing and limits are shown clearly.
3. User selects a plan.
4. Checkout provider handles payment externally.
5. Backend validates webhook signature.
6. Supabase profile/subscription record is updated server-side.
7. UI refreshes entitlements.
8. Failed payment leaves the account on the previous plan.

Never unlock paid capabilities solely from frontend state.

## 15. Complete Navigation Examples

### Guest solve

`Landing → Solve → Generate scramble → Configure IDA* → Solve → Result → Replay → Sign in to save → Sign in → Result/History`

### Existing user

`Sign in → Dashboard → History → Result → Compare this scramble → Benchmark → Save report`

### Failed job

`Solve → Running → Timeout → Adjust timeout/algorithm → Run again → Result`

### Google sign-in

`Solve → Save result → Sign in → Continue with Google → Supabase callback → Original result → Save result`

## 16. AI Coding Agent Rules

- Create routes and protected-route behavior before styling every page.
- Implement each button with a real action, loading state, error state, and success state.
- Do not invent API responses; use shared schemas.
- Do not expose Supabase service-role credentials.
- Keep unsaved cube state stable during navigation.
- Verify every returned solution by applying it.
- Do not mark timed-out or partial jobs as solved.
- Use feature folders and avoid putting solver logic in React components.
