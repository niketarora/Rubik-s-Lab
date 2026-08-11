# Frontend Design System

**Source:** Approved UI screenshots (Landing, Solver Workspace, Benchmark Workspace, Dashboard, History, Result Details, Documentation, Sign In, Sign Up)
**Status:** Implementation-ready — this document is the visual source of truth. Every screen the frontend team builds must match it exactly; do not introduce new colors, fonts, spacing, or component shapes not listed here.
**Date:** 2026-08-09

## 1. Design Philosophy

"RUBIK'S LAB" reads as a clean, technical, data-dense product — closer to a developer analytics tool (think Vercel/Linear/Stripe dashboards) than a playful cube app. The palette is mostly neutral (white/off-white/near-black) with the cube's own six colors used sparingly and intentionally: as accent/status colors in charts and badges, and literally on the cube net. Monospace type is used deliberately anywhere raw algorithmic data appears (scrambles, move sequences, metrics, logs, pseudocode) to signal "this is the machine talking," while a clean sans-serif carries all human-facing copy. Every screen keeps generous white space, thin 1px borders instead of heavy shadows, and small-caps/uppercase micro-labels above data.

## 2. Brand Identity

- **Wordmark:** "RUBIK'S LAB" — bold, black, all-caps, sans-serif, tight tracking.
- **Version tag:** directly under the wordmark, small, monospace, blue: `v1.2.0-beta`.
- **Logomark:** a small rounded-square icon (≈32×32px, ~8px corner radius) divided into a 2×2 grid of solid colors — red (top-left), blue (top-right), green (bottom-left), yellow (bottom-right) — evoking a minimal cube face. Used at fixed size in the navbar only; not used as a favicon-scale asset elsewhere in these screens.
- **Footer brand block:** "RUBIK'S ALGORITHM LAB" (bold, black, larger than body) + one-line gray tagline: *"Demystifying state-space search, heuristic design, and combinatorial optimization through the lens of the world's favorite puzzle."*

## 3. Color System

All values below are best-fit hex approximations read from the screenshots. Treat them as the canonical tokens going forward.

### 3.1 Neutrals

| Token | Hex | Usage |
|---|---|---|
| `bg-page` | `#F7F7F8` | Default page background (every logged-in/app screen) |
| `bg-surface` | `#FFFFFF` | Navbar, cards, footer, table backgrounds |
| `bg-code` | `#0F172A` | Pseudocode / terminal-style blocks (docs page) |
| `border-subtle` | `#E5E7EB` | Card borders, table row dividers, navbar bottom border |
| `text-primary` | `#111827` | Headings, primary body text, button labels on black |
| `text-secondary` | `#6B7280` | Subheadings, descriptions, muted labels, table meta |
| `text-muted` | `#9CA3AF` | Placeholder text, disabled labels, footer copyright |
| `text-on-dark` | `#F8FAFC` | Text on `bg-code` / black buttons |

### 3.2 Brand / Accent

| Token | Hex | Usage |
|---|---|---|
| `accent-blue` | `#2563EB` | Active nav link, primary links, "Start Benchmark" button, checkbox checked state, info log lines, version tag |
| `accent-blue-bg` | `#DBEAFE` | Landing page eyebrow pill background |
| `accent-green` | `#16A34A` | Success states — "Solved" badge, success-rate figures, IDA\* bars, pruning-efficiency numbers |
| `accent-green-bg` | `#DCFCE7` | "Solved" badge background |
| `accent-red` | `#DC2626` | Failure/timeout states — "Timed Out" badge, BFS bars in comparisons, pruned-node counts, error text |
| `accent-red-bg` | `#FEE2E2` | "Timed Out" badge background |
| `accent-orange` | `#EA580C` | IDDFS bars/labels, warning-tier metrics (e.g. medium success rate) |
| `accent-black` | `#0F172A` | Primary button fill ("Get Started", "Sign In", "Create Account", "Save Benchmark Run", "Replay solution steps") |

### 3.3 Cube Sticker Colors (literal, non-negotiable — must match physical cube colors)

| Face | Hex |
|---|---|
| Yellow (U) | `#FACC15` |
| White (D) | `#FFFFFF` (with black grid lines) |
| Orange (L) | `#F97316` |
| Green (F) | `#22C55E` |
| Red (R) | `#EF4444` |
| Blue (B) | `#3B82F6` |

## 4. Typography

- **Sans-serif (UI/body/headings):** a clean geometric/grotesque sans (Inter-equivalent). Used for every heading, nav item, label, paragraph, and button.
- **Monospace (data/code):** used exclusively for: scramble strings, move sequences, algorithm metrics (numbers + units like `4.2ms`, `14,203`), log/trace text, code blocks, and the `v1.2.0-beta` tag. This is the single strongest visual signature of the product — never render a scramble or metric in the sans-serif face.

### 4.1 Type Scale

| Role | Size | Weight | Color | Example |
|---|---|---|---|---|
| Page H1 | 32px | 700 (bold) | `text-primary` | "Algorithm Benchmark Workspace", "Your Solving Workspace" |
| Page subtitle | 15px | 400 | `text-secondary` | "Setup and execute massive automated state-space searches..." |
| Card title | 17px | 700 | `text-primary` | "Benchmark Configuration", "Search Statistics" |
| Section eyebrow (landing) | 11px | 600, uppercase, letter-spacing 0.05em | `accent-blue` on `accent-blue-bg` pill | "INTELLIGENT STATE-SPACE EXPLORATION" |
| Micro-label | 11px | 600, uppercase, letter-spacing 0.04em | `text-secondary` | "CURRENT TESTCASE SCRAMBLE", "SUCCESS", "ALGORITHM" |
| Body | 14px | 400 | `text-primary` / `text-secondary` | table cells, form helper text |
| Monospace data | 13–14px | 400–600 | contextual (see §3) | `D L2 F U R' B' L B D'...`, `14,203`, `4.2ms` |
| Button label | 14px | 600 | white or `text-primary` | "Start Benchmark", "Sign In" |
| Stat figure (dashboard) | 28px | 700 | contextual color (blue/green/orange/red) | `145`, `98.6%`, `14.2ms`, `11 moves` |

## 5. Layout & Spacing

- **Navbar:** fixed height ~64px, white background, 1px bottom border (`border-subtle`), horizontal padding ~32px on desktop. Left: logo + wordmark + version tag stacked. Center: 4 nav links, evenly spaced, ~32px gap. Right: "Sign In" text link + black "Get Started" pill button (~8px radius), ~16px gap between them.
- **Page container:** centered, max-width ~1440–1536px, horizontal padding ~40px, top padding ~40px below navbar.
- **Cards:** white background, 1px `border-subtle`, 12px corner radius, padding 24px, no heavy drop shadow (flat/borderline-flat elevation).
- **Grid patterns observed:**
  - Benchmark Workspace: 2-column top row (config card ~65% width, progress card ~35%), full-width results table below, 2-column bottom row (chart ~65%, actions ~35%).
  - Dashboard: 4-column stat-card row, 2-column row (timing bar chart ~65%, donut chart ~35%), full-width recent-runs table.
  - Solver Workspace: 2-column top (cube net + manual controls ~55%, search parameters ~45%), full-width solution replay bar below.
  - Result Details: full-width "optimal solution" card, then 2-column (search statistics ~65%, actions sidebar ~35%).
  - Documentation: fixed-width left sidebar (~220px) + flexible main content column, both below the navbar.
  - Auth pages (Sign In/Sign Up): no navbar/footer — a single centered white card (~460px wide) on the `bg-page` background, vertically centered in viewport.
- **Footer:** white background, 1px top border, three-column layout (brand block + two link columns: "ALGORITHMS", "LABORATORY"), thin divider, then a bottom bar with copyright text (left) and "GitHub" / "API Docs" links (right, blue).

## 6. Components

### 6.1 Buttons

| Variant | Background | Text | Border | Radius | Example |
|---|---|---|---|---|---|
| Primary (black) | `accent-black` | white, 600 weight | none | 8px | "Get Started", "Sign In", "Create Account", "Save Benchmark Run", "Replay solution steps" |
| Primary (blue) | `accent-blue` | white, 600 weight | none | 8px | "Start Benchmark" |
| Primary (green) | `accent-green` | white, 600 weight | none | 8px | "Solve Cube" |
| Secondary/outline | white | `text-primary` | 1px `border-subtle` | 8px | "Reset Configuration", "Export Data (JSON/CSV)", "Continue with Google" |
| Text link | transparent | `accent-blue` | none | n/a | "Share Performance Report", "View Details", "Compare with other algorithms", "Forgot password?" |

All buttons: ~14px vertical padding, ~20px horizontal padding, 14px/600 label. Full-width on auth-page forms; auto-width elsewhere.

### 6.2 Cards

White surface, 1px border, 12px radius, 24px internal padding, 20–24px gap between stacked/side-by-side cards. Card title (17px/700) sits at the top, optionally with a right-aligned action (e.g. dashboard's "Run benchmark" / "New solve" buttons sit beside the H1, not inside a card).

### 6.3 Status Badges (pills)

Small rounded-full pill, ~4px vertical / 10px horizontal padding, 11–12px/600 uppercase-or-sentence-case text.

| State | Background | Text |
|---|---|---|
| Solved / Success | `accent-green-bg` | `accent-green` |
| Timed Out / Failed | `accent-red-bg` | `accent-red` |

### 6.4 Inputs

White background, 1px `border-subtle`, 8px radius, ~10px vertical / 12px horizontal padding, 14px text, gray placeholder (`text-muted`). Label sits above the field: bold, 11px, uppercase, `text-primary` on auth forms (e.g. "EMAIL", "PASSWORD", "FULL NAME") — note this is one of the few places uppercase labels are dark rather than gray, since they're form labels rather than data captions.

Scramble/move-sequence input fields render their value in **monospace** even though the field chrome (border/radius/padding) matches other inputs.

### 6.5 Checkboxes

Small square, 1px border, 4px radius; checked state fills `accent-blue` with a white check. Used for algorithm multi-select ("ALGORITHMS TO COMPARE": BFS/DFS/IDDFS/IDA\*) and the sign-up Terms-of-Service agreement.

### 6.6 Tables

- Header row: 11px/600 uppercase `text-secondary` labels, no background fill, bottom border.
- Body rows: 14px, separated by 1px `border-subtle` row dividers, no zebra striping, generous row height (~48–56px).
- Numeric/scramble/move columns render in monospace; status columns render as badges (§6.3); action columns render as blue text links ("View Details", "Retry").
- Pagination: bottom-right, "Showing X–Y of Z" text (`text-secondary`) on the left, "Previous"/"Next" outline buttons on the right.

### 6.7 Progress Bars

Thin (~6–8px tall), fully rounded, light-gray track (`border-subtle`-toned), filled with `accent-blue` (job progress) or contextual algorithm color (timing comparisons: green/orange/blue/red per algorithm). A right-aligned label shows the numeric value/percentage in monospace.

### 6.8 Log / Status Console Blocks

Light-gray inset panel (not full black — lighter than the docs pseudocode block), monospace text, colored status tags inline: `[OK]` green, `[RUN]` blue, `[info]` gray, `[success]` green, `[stats]` gray — used in the Benchmark Workspace "Active Benchmark Status" panel and the Landing page "Log Deployment Trace" panel.

### 6.9 Code / Pseudocode Block (Documentation page)

Full dark-navy background (`bg-code`), rounded top corners, a small uppercase amber/yellow header label in monospace (e.g. "IDA\* SOLVER PSEUDOCODE"), body content in monospace on `text-on-dark`.

### 6.10 Donut / Ring Chart

Used for single-metric breakdowns (Dashboard "Heuristic Efficacy"): thick ring, green segment for the primary/positive metric, a muted secondary color for the remainder, with a text legend to the right (colored dot + label + percentage) rather than labels on the ring itself.

## 7. Cube Visualization Component

Two distinct renderings appear across the screens; both must be supported:

1. **Landing-page preview cube** (`Image 5`): a compact 2×2 grid of colored squares (yellow, blue, red, green) inside a bordered card, purely decorative, labeled underneath with "Initial State S_0 → Solved State G" in monospace, the arrow and "Solved State G" portion in `accent-green`.
2. **Solver Workspace cube net** (`Image 9`): the full unfolded 3×3 sticker net in the classic cross layout — one 3×3 face on top (Yellow/U), a row of four 3×3 faces in the middle (Orange/L, Green/F, Red/R, Blue/B, left to right), and one 3×3 face on the bottom (White/D). Each sticker is a small square with a thin black border; faces are separated by whitespace, not touching. Labeled "2D Cube Net Sticker Map" with a small "Flat sticker net projection" tag top-right.

Below the manual-rotation button row (`U D L R F B U' D' L' R' F' B'`, each its own small outline button in a horizontal row, monospace labels), render `Undo` / `Redo` / `Reset to Solved` as small colored text actions (orange "Undo", orange "Redo", blue "Reset to Solved").

## 8. Page-by-Page Specs

### 8.1 Landing (`/`)

- Nav: "Explore" active (blue).
- Hero: left column — small blue eyebrow pill, large bold H1 ("Explore how algorithms solve a Rubik's Cube"), gray subtext, two buttons (black "Try the Solver", outline "Compare Algorithms"). Right column — bordered card containing the compact preview cube (§7.1).
- "Core Search Strategies" section: light-gray section background, small orange eyebrow label ("THE FOUR CHANNELS"), bold H2, then a 4-column row of cards — one per algorithm (BFS/DFS/IDDFS/IDA\*) — each with a small colored algorithm-code pill (top-left of card), bold card title, gray description paragraph, and a bottom meta line in monospace ("Completeness: Yes | Space: O(b^d)").
- "Visualizing DSA Metrics" section: white background, 2-column — left: blue eyebrow, bold H2, gray paragraph, two numbered feature rows (`[01]`, `[02]` in monospace) each with a bold title and gray description; right: the log console block (§6.8).
- Footer as described in §5.

### 8.2 Sign In (`/auth/sign-in`)

Standalone centered card, no navbar/footer (§5). Order top-to-bottom: logomark (centered, small), bold H2 "Welcome Back", gray subtext "Unlock absolute optimization logs.", full-width outline "Continue with Google" button, "OR" divider (thin lines either side of centered gray text), EMAIL label + input, PASSWORD label + input with right-aligned blue "Forgot password?" link on the same row as the label, full-width black "Sign In" button, centered footer line "New operator? **Create account**" (link in blue/bold).

### 8.3 Sign Up (`/auth/sign-up`)

Same card shell as Sign In. Order: logomark, bold H2 "Register Workspace", gray subtext "Create a free sandbox for performance analytics.", FULL NAME / EMAIL ADDRESS / PASSWORD labeled inputs, a checkbox row ("I agree to the Terms of Service & Privacy Policy."), full-width black "Create Account" button, centered footer line "Already registered? **Sign in**".

### 8.4 Solver Workspace (`/solver`)

Nav: "Solver Workspace" active. Two cards side by side: left — "2D Cube Net Sticker Map" (cube net §7.2, manual rotation buttons, undo/redo/reset); right — "Search Parameters" (scramble input in monospace + "Generate scramble"/"Apply stickers" buttons, ALGORITHM dropdown, HEURISTIC dropdown, collapsible "ADVANCED PARAMETERS" summary line in monospace gray text, full-width green "Solve Cube" button). Below both: a full-width "Solution Replay" bar — blue pill label "SOLUTION REPLAY", monospace move sequence inline, right-aligned speed selector + prev/play/next controls — followed by a 5-column metrics strip (Solution Length, Nodes Explored, Nodes Pruned in red, Execution Speed in green, Memory Footprint in blue), each a micro-label over a bold monospace figure.

### 8.5 Benchmark Workspace (`/benchmark`)

Nav: "Performance Dashboard" active (note: in these screens this nav item's route serves both the dashboard and benchmark workspace — see §9 note). Layout as specified in §5. Left card "Benchmark Configuration": scramble display (monospace, read-only-styled field), "ALGORITHMS TO COMPARE" checkbox row (BFS/DFS/IDDFS/IDA\*), a 4-column row of small labeled inputs (Test Cases, Scramble Depth, Timeout, Memory Limit), then blue "Start Benchmark" + outline "Reset Configuration" buttons. Right card "Run Progress": a labeled progress bar ("Running test cases... 75/100 (75%)") plus an "ACTIVE BENCHMARK STATUS" log console (§6.8). Below: full-width "Benchmark Performance Results" table (columns: Algorithm, Success, Median T, Mean T, P95 T, Avg Len, Nodes Exp, Pruning, Memory — numeric columns in monospace, success % colored by tier: green ≥ ~90%, orange mid, red low). Bottom row: "Median Execution Time (ms)" horizontal bar chart (one bar per algorithm, algorithm-specific color) beside an "Actions" card (black "Save Benchmark Run", outline "Export Data (JSON/CSV)", blue text link "Share Performance Report").

### 8.6 Dashboard (`/dashboard`)

Nav: "Performance Dashboard" active. H1 "Your Solving Workspace" with right-aligned outline "Run benchmark" + black "New solve" buttons on the same row. 4-column stat-card row (Total Solves / Success Rate / Avg Solve Time / Best Path Length), each: small uppercase gray label, large bold colored figure (blue/green/orange/red respectively), small gray meta line beneath. Below: 2-column row — "Timing by Algorithm (ms)" horizontal bar chart (4 bars: IDA\* green, IDDFS orange, BFS blue, DFS red, with a non-numeric "OOM/Timeout" label replacing a bar value when a run failed) beside "Heuristic Efficacy" donut chart (§6.10). Bottom: full-width "Recent Runs Log" table, same column/badge conventions as the History table.

### 8.7 History (`/history`)

Nav: "Performance Dashboard" active. H1 "Solve History Log" + gray subtext. Filter row: a search input ("Search scramble...") plus three dropdown filters (Algorithm, Status, Date). Full-width table (columns: Scramble Sequence [monospace], Algorithm, Status [badge], Length, Time, Date, Action [blue "View Details" or "Retry" link]). Footer row: "Showing 1-3 of 145 solves" (left) + Previous/Next buttons (right).

### 8.8 Result Details (`/results/:id`)

Nav: "Solver Workspace" active. Breadcrumb "← Back to workspace" (blue) above H1 "Solve Log #9824a-IDF" with an inline green "SUCCESSFULLY SOLVED" badge. Full-width card: "OPTIMAL SOLUTION MOVE SEQUENCE (12 MOVES)" label, large monospace blue move sequence, right-aligned outline "Copy move list" button. Below: a tab row (Algorithm Metrics / Search Trace Log / Graph Explanation — active tab bold black with underline, inactive tabs gray). Two-column body: left "Search Statistics" card — a label/value list (Selected Algorithm, Active Heuristic Model, Execution Time, States/Nodes Generated, Pruned Leaves [red], Transposition Cache Hits [green], Max Search Depth Reached, Max Memory Footprint), each row right-aligned bold monospace value against a left gray label, separated by thin dividers; right "Actions" card — stacked buttons: black "Replay solution steps", outline "Save to Workspace", outline "Share report", blue text link "Compare with other algorithms".

### 8.9 Documentation (`/docs/:topic`)

Nav: "DSA Docs" active. Left sidebar: grouped nav under uppercase gray section headers ("GETTING STARTED", "ALGORITHMS", "HEURISTICS"), plain-text links, active link ("IDA\* Heuristic Search") bold blue. Main column: H1 with the algorithm name, gray intro paragraph. A bordered diagram card titled "Search Tree Threshold Pruning Diagram" containing a simple node-and-circle tree rendered with plain circular nodes (outline style) connected implicitly by vertical position, with pruned nodes highlighted red-outline/red-text and kept nodes green-outline/green-text, and a dashed horizontal "PRUNING THRESHOLD F(N) > 12" divider line in red beneath the pruned tier. Below that, the dark pseudocode block (§6.9). Further down (partially visible), a 2-column pair of complexity callout boxes — bold large Big-O notation (e.g. `O(b^d)` red-ish/dark, `O(d)` green) each with a one-line gray explanation underneath.

## 9. Consistency Notes / Open Items for Engineering

- The navbar's "Performance Dashboard" link appears active on three different screens (Dashboard, Benchmark Workspace, History) — confirm with product whether these are three routes under one nav item with sub-navigation, or whether "Performance Dashboard" should be split into distinct nav entries. Until resolved, implement as one active-state nav item covering all three routes.
- Auth pages intentionally omit the navbar/footer chrome used everywhere else — do not add them.
- Reduced-motion and keyboard-navigation requirements (PRD §9, TRD §13) apply on top of this visual spec: focus states should use a visible outline (e.g. 2px `accent-blue` ring) not shown in the static screenshots but required for accessibility compliance.
- Every hex value in §3 is a best-fit reading from screenshots, not extracted from source CSS — treat as authoritative pending a design-token handoff file (Figma/Style Dictionary) if one becomes available.
