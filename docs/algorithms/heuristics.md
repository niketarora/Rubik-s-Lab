# Heuristics

**Source:** PRD §8, FR-008, TRD §6
**Audience:** in-app documentation (FR-017) and engineering reference

## 1. Purpose

A heuristic `h(state)` estimates the minimum number of moves remaining to reach the solved state. IDA\* uses `h` to decide which branches are worth exploring at a given cost threshold (see `docs/algorithms/ida-star.md`). Every heuristic in this system must declare, and the UI must display, its **name, admissibility, consistency (where known), runtime, memory, and version** (PRD §8, TRD §6) — the metrics panel is what makes the search "visible," per the product vision (PRD §1).

## 2. Admissibility and consistency

- **Admissible:** `h(state)` never overestimates the true minimum number of moves to solve `state`. This is the property required for IDA\* to guarantee an optimal solution (PRD §4 explicitly does *not* guarantee optimality when a non-admissible heuristic is selected).
- **Consistent (monotonic):** for every state `s` and neighbor `s'` reached by one move, `h(s) ≤ cost(s, s') + h(s')`. Consistency implies admissibility and additionally guarantees `f`-values are non-decreasing along any path, which improves pruning efficiency and avoids re-expanding nodes with a better `g` later in the same pass.

## 3. Supported heuristics

### 3.1 Misplaced Pieces (`MisplacedPieces.hpp`)

- **Idea:** count the number of corner and/or edge pieces not in their solved position/orientation, then divide by the maximum number of pieces a single move can fix (a coarse admissible bound).
- **Admissibility:** admissible when divided by a valid per-move upper bound on pieces fixed.
- **Consistency:** typically weak/non-consistent in practice — it is a simple counting bound, not a distance-preserving one.
- **Runtime:** very cheap — a linear scan over corners/edges.
- **Memory:** negligible — no precomputed tables.
- **Use case:** fast, low-overhead default; a reasonable baseline for shallow-to-medium scrambles, but its pruning power weakens quickly as scrambles get deeper because the bound is loose.

### 3.2 Corner/Edge Lower Bound (`CornerEdgeLowerBound.hpp`)

- **Idea:** compute independent lower bounds on moves needed to fix corner permutation/orientation and edge permutation/orientation, and take the maximum of the two (never their sum, which could overestimate and break admissibility).
- **Admissibility:** admissible, provided each independent bound is itself admissible for its piece subset.
- **Consistency:** stronger than `MisplacedPieces` in practice, though not guaranteed fully consistent depending on exact bound construction.
- **Runtime:** modest — more computation than misplaced-piece counting, but still fast enough for interactive use.
- **Memory:** negligible to small, depending on whether small lookup tables are used to accelerate the per-piece-group bound.
- **Use case:** the recommended default for IDA\* once scrambles exceed what `MisplacedPieces` prunes effectively; a meaningfully tighter bound at modest extra cost.

### 3.3 Pattern Database (`PatternDatabase.hpp`, optional, versioned)

- **Idea:** precompute exact minimum move counts for every configuration of a chosen subset of pieces (e.g. all corners, or a group of edges), stored as a lookup table indexed by the piece subset's `CompactCube` encoding. At search time, `h(state)` is a table lookup rather than a computed bound — dramatically tighter and faster per call than the analytic heuristics above.
- **Admissibility:** admissible by construction, since each table entry is the *true* minimum distance for that subset ignoring the rest of the cube.
- **Consistency:** consistent, since it derives from actual shortest-path distances in a relaxed (subset) state space.
- **Runtime:** fastest per-call heuristic once built — a single table lookup.
- **Memory:** the most expensive of the three — proportional to the size of the chosen piece subset's state space; this is why it is optional and explicitly out of MVP scope (PRD roadmap step 8, TRD §18).
- **Versioning:** every pattern database artifact is versioned and checksummed (PRD §8, TRD §6) so that a result computed against one version is never silently compared against, or served from cache alongside, a result computed against another (see the cache-key composition in `docs/architecture/solver-integration.md`, §5).

## 4. Choosing a heuristic in the UI

The `HeuristicSelector` component (TRD §13) should present, for each available heuristic:

- Name and one-line description.
- Admissibility badge (guarantees optimal IDA\* results) vs. non-admissible warning (faster, but solution length is not guaranteed optimal).
- Approximate runtime/memory cost, so users can reason about the speed/memory/optimality triangle directly rather than by trial and error.

## 5. Relationship to pruning

Heuristics reduce the *effective branching factor* IDA\* must explore; they are complementary to, not a replacement for, the structural pruning techniques shared across DFS/IDDFS/IDA\* (inverse-move avoidance, same-face redundancy elimination, move ordering, duplicate-state/transposition-table detection — PRD §8). A strong heuristic with no structural pruning still repeats avoidable work; structural pruning with a weak heuristic still explores a large search space. Both are reported independently in the metrics panel (nodes pruned by heuristic-driven `f > threshold` cuts vs. nodes pruned by structural rules) so their individual contributions stay visible.
