# Iterative Deepening Depth-First Search (IDDFS)

**Source:** PRD §8, TRD §6
**Audience:** in-app documentation (FR-017) and engineering reference

## 1. Summary

IDDFS runs depth-limited DFS repeatedly, increasing the depth limit by one each time it fails to find a solution, starting from depth 0 (or 1). Because the first depth at which a solution is found is, by construction, the shallowest possible depth, IDDFS gives the same shortest-solution guarantee as BFS while keeping DFS's low memory footprint.

## 2. How it works on the cube graph

```text
for depth = 0, 1, 2, ... up to maxDepth:
    result = depth-limited DFS(start, limit = depth)
    if result is solved:
        return result
```

Each iteration is a complete depth-limited DFS from the scrambled state, re-exploring every state within the current depth bound from scratch.

## 3. Why it repeats work — and why that's an acceptable tradeoff

Every iteration re-visits all states already explored in previous, shallower iterations. This looks wasteful, but because the number of states grows exponentially with depth (branching factor `b`), the cost of the deepest iteration dominates the total: the sum of all shallower iterations is a small fraction of the final iteration's cost for typical branching factors. IDDFS therefore pays a modest constant-factor overhead in exchange for BFS's memory characteristics.

TRD §6: *"IDDFS runs depth-limited DFS repeatedly and records repeated work"* — the search metrics panel should surface this repeated work explicitly (e.g. total nodes generated across all iterations vs. nodes generated in only the final, successful iteration) so users can see the tradeoff rather than infer it.

## 4. Complexity

- **Time:** `O(b^d)` — asymptotically the same order as BFS, with a constant-factor overhead from repeated shallower iterations (typically `b/(b-1)` times the cost of a single depth-`d` DFS pass, for branching factor `b`).
- **Space:** `O(b·d)` — same as plain DFS, since only the current iteration's path is retained. This is IDDFS's core advantage over BFS.

## 5. Implementation notes (TRD §6)

- Each iteration is an independent depth-limited DFS call; the implementation should reuse the DFS engine with a varying `maxDepth`, applying the same move-pruning rules (inverse-move avoidance, same-face redundancy elimination) within each iteration.
- Metrics must distinguish per-iteration counts from cumulative totals: generated/expanded/pruned/duplicate nodes, elapsed time, peak memory (expected to track DFS's low peak memory, not BFS's).
- `maxDepth` bounds the number of iterations attempted; a timeout can also terminate the search mid-iteration.

## 6. When to use it

- The default recommendation for scrambles where BFS's memory usage would be prohibitive but an optimal (shortest) solution is still required.
- Good pedagogical bridge between BFS and IDA\*: it demonstrates that optimality and low memory are jointly achievable, motivating IDA\*'s further improvement — using a heuristic to also cut down the *time* cost of repeated iterations.

## 7. Tradeoffs vs. the other algorithms

| Property | IDDFS |
|---|---|
| Shortest-path guarantee | Yes |
| Memory | Low — linear in depth, like DFS |
| Time | Same order as BFS, plus repeated-work overhead |
| Good for deep scrambles | Better than BFS; still limited by exponential growth without a heuristic |

See `docs/algorithms/ida-star.md` for how adding an admissible heuristic prunes branches that IDDFS would otherwise fully explore, cutting the repeated-work overhead further.
