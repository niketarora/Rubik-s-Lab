# Rubik's Cube Solver & Algorithm Laboratory

A high-performance algorithm simulation and visualization platform for solving Rubik's Cubes (3x3). This project visualizes state-space search algorithms in real-time, highlighting core computer science concepts such as search depth, node expansion, branching factor, heuristic pruning, and memory trade-offs.

## 🚀 System Architecture Overview

The application is built using a modern full-stack architecture:
*   **Frontend**: React + Vite SPA, styled with Tailwind CSS, providing a 2D sticker net visualization, interactive controls, and visual search trace dashboards.
*   **Backend**: Node.js + Express API server handling authentication routing, job logging, and spawning the C++ solver.
*   **Computation Engine**: High-performance C++17 solver that exposes a standardized JSON Lines API over stdout.
*   **Database & Auth**: Supabase Postgres and Auth with Row Level Security (RLS) policies.

```text
React + Vite Frontend (Vercel)
         │  HTTPS / WebSockets
         ▼
Node.js + Express API (Render)
         │
         ├───► Spawns ───► C++ Solver Process (CLI Executable)
         │
         ▼  Supabase JS client
Supabase Auth & Postgres Database
```

---

## 📂 Repository Structure

```text
├── frontend/         # React + Vite application (UI, Dashboard, Replay controls)
├── backend/          # Node.js + Express server (Routing, Auth verification, Solver IPC)
├── solver-engine/    # C++17 solver project (CMake, GoogleTest, Search algorithms)
├── database/         # Database migrations, seed data, and Row Level Security policies
└── docs/             # Product Requirements, System Architecture, and Deployment guides
```

---

## 🛠️ Supported Search Algorithms

Rubik's Lab implements 4 foundational state-space search algorithms in pure C++17, showcasing the fundamental trade-offs between **time complexity**, **space complexity**, **heuristic admissibility**, and **path optimality**.

```text
                                  ┌─────────────────────────────┐
                                  │   Search Algorithm Suite    │
                                  └──────────────┬──────────────┘
                         ┌───────────────────────┴───────────────────────┐
                         ▼                                               ▼
              Uninformed Search                                  Informed Search
         ┌───────────────┼───────────────┐                               │
         ▼               ▼               ▼                               ▼
    Bidirectional       DFS            IDDFS                           IDA*
         BFS      (Depth-First) (Iterative Deepening)           (Iterative Deepening A*)
      O(b^(d/2))       O(b^d)          O(b^d)                           O(b*^d)
    Optimal (d≤8)   First Found     Optimal (Shortest)              Optimal (Heuristic)
```

### 1. Bidirectional Breadth-First Search (BFS / Meet-in-the-Middle)
* **Strategy:** Uninformed, bidirectional graph search.
* **Mechanism:** Searches concurrently in two directions:
  1. **Forward Frontier:** Expands outward from the scrambled cube state.
  2. **Backward Frontier:** Expands inward from the solved target state.
  
  When an intersection state is discovered where forward and backward frontiers meet, the forward move sequence and inverted backward move sequence are concatenated to produce the complete solution.
* **Why Bidirectional?** Standard Rubik's Cube branching factor is $b \approx 13.5$ (after eliminating immediate face repetitions). A unidirectional BFS to depth 6 must examine up to $13.5^6 \approx 6.4 \times 10^6$ states (~150 MB RAM). Bidirectional search halves the search horizon to $d/2 = 3$ in each direction ($2 \times 13.5^3 \approx 5,000$ states, $< 1$ MB RAM), speeding up solutions by orders of magnitude.
* **Pruning Optimizations:**
  * **Immediate Inverse Pruning:** Disallow returning to the parent face (e.g., `U` followed by `U'`).
  * **Same-Face Redundancy:** Disallow duplicate face turns (e.g., `U` followed by `U`).
  * **Opposite-Face Commutative Pruning:** Turns on opposite faces commute (e.g., `U D` $\equiv$ `D U`). The solver enforces a strict canonical ordering (`U` before `D`, `L` before `R`, `F` before `B`), pruning symmetric duplicate subtrees.
  * **Bit-Packed State Encoding:** Stores states as compact 64-bit `CompactCube` structs in hash sets (`std::unordered_map`) for fast $O(1)$ lookups.
* **Optimality:** **Guaranteed optimal** (shortest move sequence).
* **Time Complexity:** $\mathcal{O}(b^{d/2})$
* **Space Complexity:** $\mathcal{O}(b^{d/2})$ (stores active frontiers and visited sets in memory).
* **Ideal Use Case:** 1 to 8 move scrambles; serves as the ground-truth benchmark for solution optimality.

---

### 2. Depth-First Search (DFS)
* **Strategy:** Uninformed, depth-bounded backtracking search.
* **Mechanism:** Recursively dives down a branch to a fixed depth limit before backtracking. Returns immediately upon discovering the first valid goal state encountered along any branch.
* **Pruning Optimizations:**
  * Prevents immediate reverse and repetitive turns on the same face.
  * Tracks path state on the call stack, avoiding costly hash table lookups.
* **Optimality:** **Non-optimal**. DFS returns the first solution found within the depth limit, which is rarely the shortest path.
* **Time Complexity:** $\mathcal{O}(b^d)$
* **Space Complexity:** $\mathcal{O}(d)$ — **minimal linear memory**. Only the active branch path is retained on the execution stack.
* **Ideal Use Case:** Demonstrates the trade-off of rapid exploration with virtually zero memory overhead vs. path quality.

---

### 3. Iterative Deepening Depth-First Search (IDDFS)
* **Strategy:** Uninformed, iteratively bounded search.
* **Mechanism:** Overcomes DFS's non-optimality and BFS's memory explosion by executing successive depth-bounded DFS passes with incremental depth limits:
  $$\text{Depth} = 1, 2, 3, \dots, d_{\max}$$
* **Why Recomputation Is Negligible:** Because the branching factor $b \approx 13.5$ is large, the number of nodes at depth $d$ exceeds the sum of all nodes at preceding depths:
  $$\sum_{i=1}^{d} b^i \approx \frac{b}{b-1} b^d \approx 1.08 \times b^d$$
  Over 92% of all expanded nodes occur in the final iteration alone, so repeating shallower depths incurs less than an 8% runtime overhead while retaining $O(d)$ space complexity.
* **Pruning Optimizations:**
  * Prunes inverse moves and enforces opposite-face canonical move order.
  * Stops searching deeper branches once a solution is found at the current limit.
* **Optimality:** **Guaranteed optimal** (finds the shortest path at the first depth level containing a solution).
* **Time Complexity:** $\mathcal{O}(b^d)$
* **Space Complexity:** $\mathcal{O}(d)$ — **linear memory**.
* **Ideal Use Case:** Optimal path discovery on memory-constrained devices without requiring heuristic lookup tables.

---

### 4. Iterative Deepening A* (IDA*) with Admissible Heuristics
* **Strategy:** Informed (heuristic), cost-bounded search (Korf's Algorithm).
* **Mechanism:** Combines Iterative Deepening with an admissible heuristic function $h(n)$ to bound the search by total estimated cost:
  $$f(n) = g(n) + h(n)$$
  where $g(n)$ is the exact cost (depth) from the root, and $h(n)$ is a lower bound estimate of remaining moves to the solved state.
  * In each pass, branches where $f(n) > \text{threshold}$ are pruned immediately.
  * If no solution is reached, the threshold for the next pass is updated to the minimum $f$-value that exceeded the previous threshold.
* **Heuristic Functions & Admissibility:**
  * **Corner-Edge Lower Bound:**
    $$h(n) = \max\bigl(h_{\text{corners}}(n),\, h_{\text{edges}}(n)\bigr)$$
    Calculates the minimum required moves based on corner and edge permutation/orientation parity.
  * **Admissibility ($h(n) \le h^*(n)$):** Since $h(n)$ never overestimates the true remaining distance $h^*(n)$, IDA* is mathematically guaranteed to return the optimal (shortest) solution.
  * **Branching Factor Collapse:** Pruning subtrees with $f(n) > \text{threshold}$ drops the effective branching factor $b^*$ from $\approx 13.5$ down to $\approx 2.5 - 3.5$, unlocking significantly deeper scrambles.
* **Optimality:** **Guaranteed optimal**.
* **Time Complexity:** $\mathcal{O}({b^*}^{d})$ where $b^* \ll b$
* **Space Complexity:** $\mathcal{O}(d)$ — **linear memory**.
* **Ideal Use Case:** Default and most powerful algorithm for optimal solution discovery on medium to full scrambles.

---

### 📊 Algorithm Comparison Matrix

| Algorithm | Category | Optimality | Time Complexity | Space Complexity | Effective Scramble Range | Memory Footprint |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Bidirectional BFS** | Uninformed | **Optimal** | $\mathcal{O}(b^{d/2})$ | $\mathcal{O}(b^{d/2})$ | 1 – 8 moves | Medium ($< 10$ MB) |
| **DFS** | Uninformed | Non-optimal | $\mathcal{O}(b^d)$ | $\mathcal{O}(d)$ | 1 – 6 moves | Minimal ($< 1$ MB) |
| **IDDFS** | Uninformed | **Optimal** | $\mathcal{O}(b^d)$ | $\mathcal{O}(d)$ | 1 – 8 moves | Minimal ($< 1$ MB) |
| **IDA\*** | Heuristic / Informed | **Optimal** | $\mathcal{O}({b^*}^d)$ | $\mathcal{O}(d)$ | 1 – 15+ moves | Minimal ($< 2$ MB) |

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js** (v18 or higher) & npm
*   **CMake** (v3.14 or higher)
*   A C++17 compatible compiler (e.g., GCC, Clang, or MSVC)

---

### 2. Quick Start Command Guide

#### Step 1: Install Dependencies
Open a terminal in the project directories:
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

#### Step 2: Compile the C++ Solver
To build the high-performance CLI executable:
```bash
cd solver-engine
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```
*Note: Make sure the compiled binary (`rubiks_solver` or `rubiks_solver.exe` on Windows) is located in the `solver-engine` directory.*

#### Step 3: Configure Environment Files
1. Copy the example `.env` files:
   *   Copy `backend/.env.example` to `backend/.env`
   *   Copy `frontend/.env.example` to `frontend/.env`
2. Update the variables with your database project URL and keys.

#### Step 4: Run the Development Stack
Start the servers:
```bash
# In backend directory
npm run dev

# In frontend directory
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment Summary

To deploy your application:
1.  **Database**: Setup a free hosted database on [Supabase.com](https://supabase.com). Run [schema.sql](database/schema.sql) and [policies.sql](database/policies.sql) in the Supabase SQL editor.
2.  **Backend API**: Deploy the `backend/` folder on **Render** as a Node Web Service. Configure the build command to compile the C++ solver:
    `npm install && cd ../solver-engine && cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build`.
3.  **Frontend**: Deploy the `frontend/` folder on **Vercel** as a static website.

For complete, detailed instructions, check out the deployment documentation in the `docs/deployment/` directory.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
