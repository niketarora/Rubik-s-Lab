# Breadth-First Search (BFS)

**Source:** PRD §8, TRD §6
**Audience:** in-app documentation (FR-017) and engineering reference

## 1. Summary

BFS explores the cube-state graph level by level from the scramble's state, guaranteeing the first solution found uses the fewest moves possible. It is the reference implementation for "shortest solution" and the baseline every other algorithm is checked against.

## 2. How it works on the cube graph

- **Node:** a cube state (searched here in `CompactCube` encoding for fast hashing).
- **Edge:** one of the 18 legal moves (`U U' U2 D D' D2 L L' L2 R R' R2 F F' F2 B B' B2`).
- **Start:** the scrambled state.
- **Goal:** the solved state.

BFS maintains a FIFO queue of states to visit and a visited map (state → parent move, for path reconstruction). It pops a state, checks whether it is solved, and if not, enqueues every neighboring state reached by a legal move that has not already been visited.

## 3. Why it guarantees shortest solutions

BFS visits every state at depth *d* before any state at depth *d+1*. The first time the solved state is dequeued, it is necessarily reached by the shortest possible move sequence from the start — no state reachable in fewer moves was left unexplored.

## 4. Complexity

- **Time:** `O(b^d)` where `b` is the branching factor (up to 18, reduced by pruning) and `d` is solution depth.
- **Space:** `O(b^d)` — BFS must retain every visited state to reconstruct the path and avoid re-expansion. This is the algorithm's defining weakness: memory grows exponentially with depth, and the cube's state space is far larger than fits in memory beyond shallow scrambles.

## 5. Implementation notes (TRD §6)

- Queue + visited map + parent-pointer reconstruction.
- Memory and depth limits are enforced explicitly — `maxDepth` and `memoryLimitBytes` in `SolveOptions` — because unbounded BFS on a cube-sized state space will exhaust available memory well before finding deep solutions.
- Reported metrics: nodes generated, nodes expanded, duplicate states (states reached again via a longer or equal path), elapsed time, peak memory.

## 6. When to use it

- Short scrambles (roughly ≤ 6–7 moves in practice) where optimality matters and the state space explored stays within memory limits.
- As a correctness oracle: verifying that IDA\* with an admissible heuristic returns solutions of the same length BFS would find.

## 7. Tradeoffs vs. the other algorithms

| Property | BFS |
|---|---|
| Shortest-path guarantee | Yes |
| Memory | High — exponential, the binding constraint |
| Time | Exponential, same order as IDDFS/IDA\* in the worst case |
| Good for deep scrambles | No — runs out of memory long before search completes |

See `docs/algorithms/iddfs.md` for how repeated depth-limited DFS achieves the same shortest-path guarantee with far less memory, and `docs/algorithms/ida-star.md` for how a heuristic prunes the search space BFS explores exhaustively.
