# Depth-First Search (DFS)

**Source:** PRD §8, TRD §6
**Audience:** in-app documentation (FR-017) and engineering reference

## 1. Summary

DFS explores one branch of the cube-state graph as deep as possible before backtracking, using a depth-limited recursion or explicit stack. It is the most memory-efficient search offered, but — unlike BFS — the first solution it finds is not guaranteed to be the shortest.

## 2. How it works on the cube graph

- **Node/edge:** same as BFS — a `CompactCube` state and one of the 18 legal moves.
- DFS descends from the scrambled state, applying moves and recursing, until it either finds the solved state, hits a depth limit, or exhausts the current branch's moves — at which point it backtracks and tries the next unexplored move at the previous depth.
- A **depth limit** is required in practice, since unbounded DFS on a graph with cycles (a move followed by its inverse returns to the same state) can recurse indefinitely without one.

## 3. Why it is not shortest by default

DFS commits to the first branch it explores and returns as soon as it reaches the goal along that branch — regardless of whether a shorter path exists down a branch DFS hasn't reached yet. Move ordering strongly influences solution length and search time, but does not by itself guarantee optimality (TRD §6: *"DFS uses bounded recursion/stack and move pruning; it is not shortest by default"*).

## 4. Complexity

- **Time:** `O(b^m)` in the worst case, where `m` is the depth limit — can be worse than BFS if the depth limit is set much deeper than the true solution depth, since DFS may explore many long, unproductive branches before finding any solution.
- **Space:** `O(b·m)` — only the current path (plus siblings at each level) must be retained, a dramatic improvement over BFS's `O(b^d)`.

## 5. Implementation notes (TRD §6)

- Bounded recursion or an explicit stack (to avoid native call-stack overflow at depth).
- Move pruning is essential here, more so than in BFS: at minimum, never apply a move that is the exact inverse of the move that produced the current state (undoes progress for free), and avoid redundant same-face sequences (e.g. `U` followed by `U` should be represented as `U2`, not two separate `U` edges).
- Reported metrics mirror BFS: generated/expanded/pruned/duplicate nodes, elapsed time, peak memory (peak memory here is expected to be far lower than BFS at equivalent depth).

## 6. When to use it

- Memory-constrained situations, or as a fast way to check whether *any* solution exists within a depth bound, without needing the shortest one.
- As a teaching tool alongside BFS/IDDFS to make the memory/optimality tradeoff visible in the UI's metrics panel.

## 7. Tradeoffs vs. the other algorithms

| Property | DFS |
|---|---|
| Shortest-path guarantee | No |
| Memory | Low — linear in depth limit |
| Time | Can be worse than BFS if depth limit is loose |
| Good for deep scrambles | Only if optimality is not required |

See `docs/algorithms/iddfs.md`, which layers DFS's low memory footprint with BFS's shortest-path guarantee at the cost of repeated work.
