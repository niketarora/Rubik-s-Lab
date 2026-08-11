# Iterative Deepening A* (IDA\*)

**Source:** PRD §8, TRD §6
**Audience:** in-app documentation (FR-017) and engineering reference

## 1. Summary

IDA\* is IDDFS's informed counterpart: instead of iterating over integer *depth* limits, it iterates over *cost thresholds* derived from an admissible heuristic `h`, pruning any branch whose estimated total cost exceeds the current threshold. On a state space as large as the Rubik's Cube's, this is what makes optimal solving of realistic scrambles tractable — it is Korf's algorithm, referenced directly in the PRD vision.

## 2. Algorithm (TRD §6, PRD §8)

```text
threshold = h(root)
loop:
    (result, minExceeded) = depth-first search from root, pruning any node where g + h(node) > threshold
    if result is solved:
        return result
    if minExceeded == infinity:
        return no solution within limits
    threshold = minExceeded   # smallest cost that exceeded the previous threshold
```

Where:
- `g` = the number of moves taken so far to reach the current node from the scrambled state.
- `h` = the heuristic's estimated minimum number of moves remaining to reach the solved state.
- `f = g + h` = the estimated total cost of a solution passing through this node.

Each iteration is a depth-first traversal (so memory stays linear in depth, like DFS/IDDFS), but nodes are pruned the moment `g + h` exceeds the current threshold, rather than being pruned only by a raw depth bound. The next threshold is always the smallest `f`-value that was rejected in the previous pass — this guarantees no depth is skipped and the algorithm remains complete.

## 3. Optimality and admissibility

IDA\* returns an optimal (shortest) solution **if and only if** `h` is admissible — it never overestimates the true remaining distance to the solved state. An inadmissible heuristic can cause IDA\* to prune a branch that actually contained a shorter solution, silently returning a suboptimal result (PRD §4 non-goal: *"Guaranteed optimal solutions when a non-admissible heuristic is selected"* is explicitly out of scope — optimality is only promised when the selected heuristic is admissible, and the UI must display the heuristic's declared admissibility status, per FR-008).

## 4. Complexity

- **Time:** still exponential in the worst case, but the effective branching factor is reduced by however aggressively `h` prunes non-productive branches — a strong heuristic can be the difference between solving in milliseconds and not finishing within any practical timeout.
- **Space:** `O(b·d)` — same linear-in-depth footprint as DFS/IDDFS, since it is still a depth-first traversal underneath.

## 5. Implementation notes (TRD §6)

- Threshold initialized to `h(root)`.
- Prune condition: `g + h(node) > threshold`.
- Next threshold: minimum `f`-value that exceeded the current threshold across the whole failed pass.
- Combine with the same pruning techniques as DFS/IDDFS (inverse-move avoidance, same-face redundancy, move ordering) plus, optionally, a transposition table to detect and skip duplicate states reached via different paths within a pass (`useTranspositionTable` in `SolveOptions`).
- Metrics reported: generated/expanded/pruned/duplicate nodes, elapsed time, peak memory, and **threshold iterations** — the count of distinct thresholds tried, which is unique to IDA\* among the four algorithms and should be surfaced prominently in the metrics panel.

## 6. Heuristics used

See `docs/algorithms/heuristics.md` for the full detail on `MisplacedPieces`, `CornerEdgeLowerBound`, and the optional versioned pattern database — including their admissibility, consistency, runtime, and memory characteristics, all of which directly affect IDA\*'s pruning effectiveness.

## 7. When to use it

- The recommended default for scrambles too deep for BFS or plain IDDFS to solve within a reasonable timeout, whenever an admissible heuristic is available.
- Any time users want to see the tradeoff between heuristic strength and search speed made visible via threshold-iteration counts and pruning ratios.

## 8. Tradeoffs vs. the other algorithms

| Property | IDA\* |
|---|---|
| Shortest-path guarantee | Yes, if `h` is admissible |
| Memory | Low — linear in depth, like DFS/IDDFS |
| Time | Exponential in the worst case, but typically far better than BFS/IDDFS given an effective heuristic |
| Good for deep scrambles | Best of the four, provided a strong admissible heuristic is available |
