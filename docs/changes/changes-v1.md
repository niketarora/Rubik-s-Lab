# Change Request — UI/UX Updates (v1)

**Target:** currently deployed build at `https://rubiks-lab-client-side.vercel.app/`
**Related docs:** `docs/architecture/frontend-design.md`, `docs/product/website-flow-v2.md`, `docs/product/implementation-plan-v3.md`
**Status:** Ready to hand to Antigravity
**Date:** 2026-08-11

## How to use this document

This is a targeted change request against the already-built Phase 1 frontend, not a new feature phase. Each item below states the current behavior, the required behavior, the specific components/files it touches, and acceptance criteria. Where a change alters something documented in `frontend-design.md`, that file must be updated to match once the change ships, so the design doc stays the single source of truth.

---

## 1. Replace the 2D cube net sticker rendering

### Current

The 2D cube net (Solver Workspace) renders flat colored squares in the cross layout with thin black borders per sticker, no color legend, no scramble/reset icon — per the current `frontend-design.md` §7.2 spec.

### Required

Re-skin the cube net component to match the attached reference image:

- **Sticker style:** each sticker keeps its color but gets a slightly more tactile look — a thin darker border per sticker (not pure black), a small consistent gap between stickers within a face, and a subtle bevel/inset shadow so individual cubies read as physical tiles rather than flat color blocks.
- **Face layout:** unchanged — the cross/net layout (U top, L-F-R-B middle row, D bottom) is correct and must be preserved exactly as specified in `frontend-design.md` §7.2.
- **Color legend panel:** add a vertical color-swatch legend on the right edge of the cube net card, one swatch per face color (White, Red, Blue, Orange, Green, Yellow), stacked top to bottom, each a filled rounded-rectangle swatch with a thin border. This is new — add it as a documented component in `frontend-design.md` §6.
- **Scramble/reset icon:** add a small circular icon button in the top-left corner of the cube net card, rendered as a mini four-color pie/quadrant icon (matches the spirit of the existing logomark in `frontend-design.md` §2, but circular and used here as a "generate new scramble / reset" action, not a brand mark — keep it visually distinct from the navbar logo so users don't confuse the two).

### Files/components affected

- `CubeNet` component (2D rendering) and its styles.
- New `ColorLegend` component.
- New `CubeQuickActionIcon` component (or extend existing reset/undo/redo controls to include this icon variant).
- `frontend-design.md` §7 — update the 2D cube net spec once implemented.

### Acceptance criteria

- Cube net visually matches the reference image's sticker treatment, legend, and icon placement.
- Legend colors are pulled from the same color tokens already defined in `frontend-design.md` §3.3 — do not introduce new hex values.
- Icon is keyboard-accessible and has an `aria-label` (e.g. "Generate new scramble").

---

## 2. Add a 2D / 3D cube view toggle, with a fully orbit-rotatable 3D model

### Current

Only the 2D sticker net exists. PRD FR-013 already anticipates this: *"MVP uses a 2D cube net. Version 2 may include React Three Fiber/Three.js 3D rendering. Both must use the same normalized state conversion."* This change request activates that planned feature now.

### Required

- Add a small segmented toggle control ("2D" / "3D") near the top of the cube net card, styled per `frontend-design.md`'s existing button/tab conventions (see the "Algorithm Metrics / Search Trace Log / Graph Explanation" tab pattern on Result Details as the visual reference for how an active/inactive toggle should look).
- Build a `Cube3D` component using `@react-three/fiber` + `@react-three/drei`, rendering a proper 3D Rubik's Cube (27 cubies, correct sticker colors per face) driven by the exact same normalized cube state used by `CubeNet` — per FR-013, both views must read from one shared state, never diverge.
- The 3D view must support free orbit rotation in any direction (drag to rotate, scroll/pinch to zoom) via `OrbitControls` from `drei`. No rotation-axis restrictions.
- Switching between 2D and 3D must preserve the current cube state exactly — no reset, no desync.

### Files/components affected

- New `Cube3D` component.
- New `CubeViewToggle` component.
- Shared cube-state hook/context (already implied by FR-013's "same normalized state conversion" requirement) — if one doesn't exist yet, create it so both `CubeNet` and `Cube3D` consume the same source of truth.
- `frontend-design.md` §7 — add a new subsection documenting the 3D cube component and the toggle control.

### Acceptance criteria

- Toggling 2D↔3D never changes or resets the cube's actual state.
- 3D cube can be rotated a full 360° on every axis via mouse drag / touch drag, with no lock.
- Sticker colors and face positions in 3D match the 2D net for the same state (spot-check against a known scramble).
- Works on both desktop (mouse) and mobile (touch) input.

---

## 3. Animate every move of the solution in 3D on the replay screen

### Current

Solution replay (Solver Workspace bottom bar, and the "Replay solution steps" action on Result Details) works against the 2D net / move list only — no 3D animation.

### Required

- When the 3D view is active during replay, each move in the solution sequence must play as a real animated quarter/half-turn rotation of the correct face layer — not an instant snap-to-state jump. This is what makes the replay legible: the user should visually see *which* layer is turning and *which direction*, matching standard cube-notation semantics (e.g. `U` visibly rotates only the top layer clockwise when viewed from above).
- Respect the existing replay controls (play, pause, next, previous, restart, speed, jump-to-move) — the 3D animation must hook into the same playback state machine already driving the 2D replay, not a separate one.
- Respect reduced-motion preference (already a stated requirement in PRD §9 / `frontend-design.md` §9): when reduced motion is enabled, skip the animated turn and jump directly to the resulting state instead, without breaking the play/pause/step controls.
- Animation speed should scale with the existing "Speed" control (e.g. 1.0x, 2.0x) already present in the Solver Workspace replay bar.

### Files/components affected

- `Cube3D` component — add per-move rotation animation (typically an animated group transform over ~150–300ms per quarter turn, adjusted by the speed multiplier).
- Replay state machine / `SolutionPlayer` — expose the "current move being played" and "direction" so `Cube3D` can trigger the correct layer rotation.
- `frontend-design.md` — document the animated-replay behavior for 3D under the Solution Replay section.

### Acceptance criteria

- Every move in a solved sequence visibly rotates the correct face layer in the correct direction before settling.
- Play/pause/next/previous/restart/jump-to-move all work correctly against the 3D animated view, matching current 2D-replay behavior exactly.
- Reduced-motion users get instant state changes with no animated turn, but retain full control functionality.
- Final replay state is verified solved (existing requirement, FR-012) regardless of which view (2D or 3D) was used to watch it.

---

## 4. Remove the "Guest / User / Admin" role label from the top-right of the navbar

### Current

The navbar's top-right area currently displays a role indicator (e.g. text reading "Guest," "User," or "Admin") alongside the Sign In / Get Started controls.

### Required

Remove this role label entirely from the visible UI. The user's role should still govern route access and feature availability (per `website-flow-v2.md` §3's access rules) — this is a **visual-only** removal, not a permissions change. Do not replace it with an icon, badge, or any other role indicator unless specifically requested later.

### Files/components affected

- Navbar component.

### Acceptance criteria

- No role text/badge is visible anywhere in the navbar for guest, registered, or admin users.
- Route guards and permission checks (client- and server-side) are unaffected — only the visual label is removed.

---

## 5. Rebalance navbar button layout by auth state, and give the navbar visual depth

### Current

Per `frontend-design.md` §5 and §9, the navbar always shows 4 nav links left-of-center plus "Sign In" / "Get Started" on the right, regardless of auth state. The navbar is visually flat — white background, a single 1px bottom border, no shadow or interactive feedback.

### Required

**5a. Guest state (not signed in):**
Show exactly 3 primary nav buttons, centered as a group with equal, comfortable spacing between them (not left-aligned, not stretched to the edges). This replaces the current always-4-links layout for guests specifically.

**5b. Signed-in state (registered user or admin):**
Show exactly 5 nav buttons, centered as a group with equal spacing, once the user is authenticated (the additional 2 reflect authenticated-only destinations such as Dashboard/History, consistent with what `website-flow-v2.md` already gates behind login).

**5c. Both states:**
Keep the logo/wordmark on the far left and the auth action (Sign In + Get Started for guests, or an account control for signed-in users — see item 4 above regarding no role label) on the far right; only the middle nav-link group's contents and centering change based on auth state.

**5d. Navbar depth:**
The navbar currently reads as visually flat. Add:
- A soft drop shadow beneath the navbar (subtle, e.g. a low-opacity shadow rather than a hard line) so it visually sits above the page content, replacing or supplementing the current 1px border.
- A hover state on each nav link (e.g. a subtle background tint or underline transition) so the navbar feels interactive rather than static.
- Keep the existing active-link blue color convention from `frontend-design.md` §3.2/§6 — hover states are additive, not a replacement for the active-state color.

### Files/components affected

- Navbar component and its layout logic (needs to branch on auth state for which/how-many links render, and how they're centered).
- `frontend-design.md` §5 (Layout & Spacing) and §9 — update the navbar spec to document the guest-vs-authenticated link sets, centering rule, shadow, and hover behavior once implemented. This also resolves the open question already flagged in `frontend-design.md` §9 about the "Performance Dashboard" link's multi-route active state — use this change to finalize and document which links exist in which auth state.

### Acceptance criteria

- Guest users see exactly 3 centered nav buttons with visually even spacing.
- Signed-in users (regular and admin) see exactly 5 centered nav buttons with visually even spacing.
- Navbar has a visible soft shadow and each nav link has a clear hover state.
- No layout shift/jank when auth state changes (e.g. right after sign-in) — the nav group should re-render cleanly, not flash or jump.

---

## 6. Software-engineering review of the live deployment

I reviewed `https://rubiks-lab-client-side.vercel.app/` for this request. It's a client-rendered single-page app, so an automated fetch only surfaces the static `<head>` metadata (title: *"Rubik's Algorithm Laboratory — Visualizing State-Space Search"*, a solid meta description, and a standard viewport tag) rather than the full rendered DOM — I was not able to inspect live component markup, network payloads, or runtime behavior this way. Treat the recommendations below as a standard pre-launch engineering checklist to run against the real deployed build (ideally via Lighthouse, WebPageTest, and axe DevTools) rather than findings from a specific defect I directly observed. Recommend running that tooling and folding the results into this same change-request format.

**Performance**
- Since a 3D cube view is being added (item 2), lazy-load `@react-three/fiber`/`@react-three/drei`/`three` behind the 2D/3D toggle rather than bundling them into the initial page load — most first-time visitors will land on the 2D view.
- Confirm code-splitting per route (Landing shouldn't ship Solver Workspace's bundle, etc.).
- Run a Lighthouse pass specifically on Largest Contentful Paint and Total Blocking Time for the Solver and Benchmark workspaces, since they're the most component-dense pages.

**Accessibility**
- Verify color contrast for the status badges and colored metrics (green/orange/red text on light tint backgrounds, per `frontend-design.md` §6.3) meets WCAG AA — small colored text on tinted backgrounds is a common contrast failure point.
- Confirm every icon-only control (including the new scramble/reset icon from item 1 and the 2D/3D toggle from item 2) has an accessible name, not just a visual icon.
- Confirm the 3D cube (item 2/3) is not the *only* way to perceive the cube state — the 2D net must remain a fully equivalent, screen-reader-friendlier alternative, per PRD's accessibility requirements.

**SEO / metadata**
- Title and meta description are already reasonable. Add Open Graph and Twitter Card tags (title, description, a static preview image of the Solver Workspace) so shared links render properly on social platforms.
- Add a `robots.txt` and `sitemap.xml` if not already present, and confirm public pages (Landing, Documentation) are crawlable while authenticated pages are not indexed.

**Security**
- Confirm the Supabase anon key is the only Supabase credential shipped to the browser bundle (per TRD §8 / `production.md` §4) — worth a one-time `grep` of the production build output for `SERVICE_ROLE` as a sanity check.
- Confirm CORS is scoped to the actual frontend origin, not `*`, once the API is live.
- Add basic security headers (CSP, X-Frame-Options, etc.) at the hosting layer if not already configured — Vercel supports this via `next.config`/`vercel.json` headers or middleware depending on the framework.

**Reliability / UX polish**
- Add explicit loading skeletons and error boundaries around the Solver/Benchmark workspaces so a failed API call degrades gracefully instead of showing a blank panel.
- Add basic analytics/error monitoring (e.g. Sentry) before wider release, given the app has real async job flows (solve jobs, benchmarks) that can fail in ways only visible in production.
- Once real backend integration (Phase 3 of `implementation-plan-v3.md`) is live, load-test the solve-job and benchmark endpoints specifically, since these are the most compute-intensive paths and the most likely to reveal timeout/queueing issues under concurrent users.

**Recommended immediate next step:** run Lighthouse + axe DevTools against the live URL and attach the report to this document as an addendum before Antigravity starts on items 1–5, so any pre-existing performance/accessibility issues are fixed alongside these changes rather than layered under them.

---

## Summary for Antigravity

Implement items 1–5 as scoped UI changes against the existing Phase 1 frontend — no backend or data-layer changes required for any of them. Update `docs/architecture/frontend-design.md` to reflect the new cube-net styling, the color legend, the 2D/3D toggle, the 3D cube and its animated replay behavior, and the finalized navbar spec once each change ships, so the design doc continues to match the live product exactly. Item 6 is a review checklist, not an implementation task — schedule it as a short audit pass (Lighthouse/axe) rather than folding it into the same PR as items 1–5.
