// Mock Data Fixtures representing Supabase schemas and API contracts

export const MOCK_PROFILES = {
  user: {
    id: "mock-user-123",
    name: "Alex Mercer",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    role: "USER",
    created_at: "2026-08-01T12:00:00Z"
  },
  admin: {
    id: "mock-admin-999",
    name: "System Administrator",
    avatar_url: null,
    role: "ADMIN",
    created_at: "2026-07-01T08:00:00Z"
  }
};

// Mock solve jobs with their associated results
export const MOCK_SOLVES = [
  {
    id: "9824a-IDF",
    user_id: "mock-user-123",
    status: "SOLVED",
    input_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2",
    normalized_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2",
    cube_state: "YYYYYYYYYGGGGGGGGGRRRRRRRRROOOOOOOOOBBBBBBBBBWWWWWWWWW", // visual representation
    algorithm: "IDA_STAR",
    heuristic: "CORNER_EDGE_LOWER_BOUND",
    max_depth: 30,
    timeout_ms: 30000,
    collect_trace: true,
    solver_version: "cpp-2.0.0",
    failure_code: null,
    created_at: "2026-08-10T12:30:00Z",
    started_at: "2026-08-10T12:30:00.100Z",
    completed_at: "2026-08-10T12:30:04.300Z",
    result: {
      id: "result-1",
      solution: ["R", "U'", "R2", "F", "D", "L'", "B2", "R2", "U", "B", "R'", "F'"], // 12 moves
      solution_length: 12,
      nodes_generated: 42105,
      nodes_expanded: 14203,
      nodes_pruned: 27902,
      duplicate_states: 1254,
      max_depth_reached: 12,
      threshold_iterations: 4,
      elapsed_ms: 4200,
      peak_memory_bytes: 1420000, // ~1.4MB
      cache_hit: false
    }
  },
  {
    id: "8731b-BFS",
    user_id: "mock-user-123",
    status: "SOLVED",
    input_scramble: "R U R' F2 U'",
    normalized_scramble: "R U R' F2 U'",
    cube_state: "scrambled_state_bfs",
    algorithm: "BFS",
    heuristic: null,
    max_depth: 10,
    timeout_ms: 5000,
    collect_trace: false,
    solver_version: "cpp-2.0.0",
    failure_code: null,
    created_at: "2026-08-10T11:15:00Z",
    started_at: "2026-08-10T11:15:00.050Z",
    completed_at: "2026-08-10T11:15:00.120Z",
    result: {
      id: "result-2",
      solution: ["R", "U", "R'", "F2", "U'"],
      solution_length: 5,
      nodes_generated: 852,
      nodes_expanded: 341,
      nodes_pruned: 0,
      duplicate_states: 88,
      max_depth_reached: 5,
      threshold_iterations: 1,
      elapsed_ms: 70,
      peak_memory_bytes: 45000,
      cache_hit: true
    }
  },
  {
    id: "7294c-DFS",
    user_id: "mock-user-123",
    status: "SOLVED",
    input_scramble: "U R2 F L' D2",
    normalized_scramble: "U R2 F L' D2",
    cube_state: "scrambled_state_dfs",
    algorithm: "DFS",
    heuristic: null,
    max_depth: 15,
    timeout_ms: 10000,
    collect_trace: false,
    solver_version: "cpp-2.0.0",
    failure_code: null,
    created_at: "2026-08-09T18:22:00Z",
    started_at: "2026-08-09T18:22:00.100Z",
    completed_at: "2026-08-09T18:22:00.320Z",
    result: {
      id: "result-3",
      solution: ["U", "R2", "F", "L'", "D2"], // non-optimal sometimes but this is small
      solution_length: 5,
      nodes_generated: 2541,
      nodes_expanded: 985,
      nodes_pruned: 1556,
      duplicate_states: 0,
      max_depth_reached: 12,
      threshold_iterations: 1,
      elapsed_ms: 220,
      peak_memory_bytes: 18000,
      cache_hit: false
    }
  },
  {
    id: "6102d-IDD",
    user_id: "mock-user-123",
    status: "SOLVED",
    input_scramble: "R U R' F2 D2 R'",
    normalized_scramble: "R U R' F2 D2 R'",
    cube_state: "scrambled_state_iddfs",
    algorithm: "IDDFS",
    heuristic: null,
    max_depth: 20,
    timeout_ms: 15000,
    collect_trace: false,
    solver_version: "cpp-2.0.0",
    failure_code: null,
    created_at: "2026-08-08T15:40:00Z",
    started_at: "2026-08-08T15:40:00.100Z",
    completed_at: "2026-08-08T15:40:01.300Z",
    result: {
      id: "result-4",
      solution: ["R", "U", "R'", "F2", "D2", "R'"],
      solution_length: 6,
      nodes_generated: 12402,
      nodes_expanded: 6511,
      nodes_pruned: 5891,
      duplicate_states: 0,
      max_depth_reached: 6,
      threshold_iterations: 6,
      elapsed_ms: 1200,
      peak_memory_bytes: 28000,
      cache_hit: false
    }
  },
  {
    id: "3492e-OOM",
    user_id: "mock-user-123",
    status: "MEMORY_LIMIT",
    input_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2 F R U",
    normalized_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2 F R U",
    cube_state: "scrambled_state_oom",
    algorithm: "BFS",
    heuristic: null,
    max_depth: 25,
    timeout_ms: 30000,
    collect_trace: false,
    solver_version: "cpp-2.0.0",
    failure_code: "MEMORY_LIMIT",
    created_at: "2026-08-07T09:12:00Z",
    started_at: "2026-08-07T09:12:00.050Z",
    completed_at: "2026-08-07T09:12:12.450Z",
    result: null
  },
  {
    id: "1284f-TO",
    user_id: "mock-user-123",
    status: "TIMEOUT",
    input_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2 F R U",
    normalized_scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2 F R U",
    cube_state: "scrambled_state_timeout",
    algorithm: "IDDFS",
    heuristic: null,
    max_depth: 30,
    timeout_ms: 5000,
    collect_trace: false,
    solver_version: "cpp-2.0.0",
    failure_code: "TIMEOUT",
    created_at: "2026-08-06T14:05:00Z",
    started_at: "2026-08-06T14:05:00.020Z",
    completed_at: "2026-08-06T14:05:05.020Z",
    result: null
  }
];

// Mock Benchmark Suite runs
export const MOCK_BENCHMARKS = [
  {
    id: "bench-suite-99",
    name: "Standard Deep Search Benchmark",
    scramble: "D L2 F U R' B' L B D' R2 F' U' L2 F' R2 D' F2 U B2 D2",
    test_cases: 100,
    scramble_depth: 20,
    timeout_ms: 30000,
    memory_limit_bytes: 50000000, // 50MB
    created_at: "2026-08-10T14:00:00Z",
    progress: {
      completed: 100,
      total: 100,
      percentage: 100,
      logs: [
        { id: 1, type: "info", message: "Starting benchmark suite ID bench-suite-99", timestamp: "14:00:00" },
        { id: 2, type: "solve", message: "Enqueueing child solve job for BFS...", timestamp: "14:00:01" },
        { id: 3, type: "error", message: "BFS hit memory limit of 50MB (pruned 0 nodes).", timestamp: "14:00:05" },
        { id: 4, type: "solve", message: "Enqueueing child solve job for DFS...", timestamp: "14:00:06" },
        { id: 5, type: "ok", message: "DFS completed: 18 moves in 12,410ms.", timestamp: "14:00:18" },
        { id: 6, type: "solve", message: "Enqueueing child solve job for IDDFS...", timestamp: "14:00:19" },
        { id: 7, type: "ok", message: "IDDFS completed: 12 moves in 8,920ms.", timestamp: "14:00:28" },
        { id: 8, type: "solve", message: "Enqueueing child solve job for IDA*...", timestamp: "14:00:29" },
        { id: 9, type: "ok", message: "IDA* completed: 12 moves in 4,200ms.", timestamp: "14:00:33" },
        { id: 10, type: "success", message: "All benchmark cases finalized successfully.", timestamp: "14:00:34" }
      ]
    },
    results: [
      {
        algorithm: "IDA*",
        heuristic: "CORNER_EDGE_LOWER_BOUND",
        success_rate: 100.0,
        median_time_ms: 4200,
        mean_time_ms: 4500,
        p95_time_ms: 5100,
        avg_length: 12.0,
        nodes_expanded: 14203,
        pruning_ratio: "66.3%",
        peak_memory_bytes: 1420000,
        status: "SUCCESS"
      },
      {
        algorithm: "IDDFS",
        heuristic: null,
        success_rate: 100.0,
        median_time_ms: 8920,
        mean_time_ms: 9100,
        p95_time_ms: 10400,
        avg_length: 12.0,
        nodes_expanded: 92451,
        pruning_ratio: "0.0%",
        peak_memory_bytes: 28000,
        status: "SUCCESS"
      },
      {
        algorithm: "DFS",
        heuristic: null,
        success_rate: 80.0, // some timed out
        median_time_ms: 12410,
        mean_time_ms: 13900,
        p95_time_ms: 22000,
        avg_length: 18.5, // non-optimal
        nodes_expanded: 184512,
        pruning_ratio: "45.0%",
        peak_memory_bytes: 18000,
        status: "SUCCESS"
      },
      {
        algorithm: "BFS",
        heuristic: null,
        success_rate: 0.0, // ran out of memory
        median_time_ms: 0,
        mean_time_ms: 0,
        p95_time_ms: 0,
        avg_length: 0.0,
        nodes_expanded: 489502,
        pruning_ratio: "0.0%",
        peak_memory_bytes: 52000000, // Exceeded 50MB
        status: "FAILED"
      }
    ]
  }
];

// Mock trace logs for a specific solve details page
export const MOCK_TRACE_LOGS = [
  { id: 1, type: "info", message: "Initializing solver engine version cpp-2.0.0", timestamp: "12:30:00.100" },
  { id: 2, type: "info", message: "Parsed input scramble successfully: 20 moves.", timestamp: "12:30:00.120" },
  { id: 3, type: "solve", message: "Algorithm selected: IDA* (Depth-First search with heuristics)", timestamp: "12:30:00.150" },
  { id: 4, type: "solve", message: "Heuristic: CORNER_EDGE_LOWER_BOUND (admissible, consistent)", timestamp: "12:30:00.160" },
  { id: 5, type: "info", message: "Initial state heuristic estimate h(s0) = 8", timestamp: "12:30:00.170" },
  { id: 6, type: "trace", message: "IDA* Iteration threshold = 8. Expanded 240 nodes. No solution found.", timestamp: "12:30:00.450" },
  { id: 7, type: "trace", message: "IDA* Iteration threshold = 10. Expanded 4810 nodes. No solution found.", timestamp: "12:30:01.200" },
  { id: 8, type: "trace", message: "IDA* Iteration threshold = 12. Searching...", timestamp: "12:30:02.100" },
  { id: 9, type: "stats", message: "Cache stats: 1254 transposition hits, 30541 insertions.", timestamp: "12:30:03.500" },
  { id: 10, type: "trace", message: "IDA* Iteration threshold = 12. Expanded 14203 nodes. Solved!", timestamp: "12:30:04.280" },
  { id: 11, type: "ok", message: "Solution path found. Length 12 moves.", timestamp: "12:30:04.290" },
  { id: 12, type: "success", message: "Verified solution independently: Cube is fully solved.", timestamp: "12:30:04.300" }
];

// Mock Documentation contents
export const MOCK_DOCS = {
  "overview": {
    title: "Introduction to State-Space Search",
    content: "The Rubik's Cube is a classic permutation puzzle with $4.3 \\times 10^{19}$ possible states. Solving it efficiently requires treating the cube as a state-space graph, where the nodes are cube configurations and the edges are the 18 legal moves. This documentation explores the algorithms used to navigate this massive graph.",
  },
  "bfs": {
    title: "Breadth-First Search (BFS)",
    content: "Breadth-First Search (BFS) is a complete and optimal search strategy. It explores the search graph level by level, starting from the scrambled state. While it guarantees finding the shortest path (optimal move sequence), its space complexity is $O(b^d)$, where $b$ is the branching factor (typically 15-18 after pruning inverse moves) and $d$ is the depth. BFS consumes memory extremely quickly and is only recommended for very shallow scrambles (depth $\\le 6$).",
  },
  "dfs": {
    title: "Depth-First Search (DFS)",
    content: "Depth-First Search (DFS) explores as deep as possible along each branch before backtracking. It has a very low space complexity of $O(d)$, making it extremely memory efficient. However, DFS is not optimal: it does not guarantee finding the shortest solution. It may find long, redundant paths or get trapped in deep branches if not constrained by a maximum depth limit.",
  },
  "iddfs": {
    title: "Iterative Deepening DFS (IDDFS)",
    content: "Iterative Deepening DFS combines the memory efficiency of DFS with the optimality of BFS. It works by running depth-limited DFS repeatedly, incrementing the depth limit by 1 in each iteration. It guarantees finding the shortest solution (optimal path) and uses only $O(d)$ memory. The main drawback is that it repeats search efforts on upper levels in each iteration, although this overhead is minor because the number of nodes grows exponentially with depth.",
  },
  "ida-star": {
    title: "IDA* Heuristic Search",
    content: "Korf's Iterative Deepening A* (IDA*) is the state-of-the-art algorithm for finding optimal solutions for the Rubik's Cube. It uses a heuristic function $h(n)$ to estimate the distance to the solved state. The search behaves like IDDFS, but prunes any branch where the total cost $g(n) + h(n)$ exceeds the current threshold. The threshold starts at $h(root)$ and increases to the minimum exceeded cost in each iteration. For optimal solutions, the heuristic must be *admissible* (never overestimate the cost to solve).",
    pseudocode: `function IDA_STAR(root)
  threshold = h(root)
  loop
    (status, next_threshold) = SEARCH(root, 0, threshold)
    if status == SOLVED then return SUCCESS
    if next_threshold == INFINITY then return FAILED
    threshold = next_threshold
  end loop
end function

function SEARCH(node, g, threshold)
  f = g + h(node)
  if f > threshold then return (PRUNED, f)
  if is_solved(node) then return (SOLVED, g)
  min_val = INFINITY
  for each move in legal_moves(node)
    child = apply(move, node)
    (status, val) = SEARCH(child, g + 1, threshold)
    if status == SOLVED then return (SOLVED, val)
    if val < min_val then min_val = val
  end for
  return (PRUNED, min_val)
end function`,
    complexity: {
      space: { label: "Space Complexity", value: "O(d)", desc: "Requires space proportional to search depth only, preventing memory-out crashes." },
      time: { label: "Time Complexity", value: "O(b^d)", desc: "Worst-case time complexity remains exponential, but heavily pruned by the heuristic efficacy." }
    }
  },
  "heuristics": {
    title: "Heuristic Estimation Models",
    content: "A heuristic function guides IDA* by estimating moves remaining. To guarantee optimal solutions, a heuristic must be **admissible** ($h(n) \\le h^*(n)$) and **consistent** ($h(a) \\le c(a,b) + h(b)$). This project supports:\n\n1. **Misplaced Pieces:** Counts corners and edges not in their correct positions. Very fast but loose lower bound.\n2. **Corner-Edge Lower Bound:** A more advanced mathematical combining of corner distance tables and edge placements.\n3. **Pattern Database:** Checksummed precomputed lookups mapping subsets of pieces (e.g. 8 corners) to exact moves, providing highly accurate estimates.",
  }
};
