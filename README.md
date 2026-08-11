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

1.  **Breadth-First Search (BFS)**: Guarantees optimal (shortest) solution; high memory footprint.
2.  **Depth-First Search (DFS)**: Low memory footprint; does not guarantee optimal paths.
3.  **Iterative Deepening DFS (IDDFS)**: Guarantees optimality with low memory usage; repeats early states.
4.  **Iterative Deepening A* (IDA*)**: Employs heuristic evaluation (e.g., Corner-Edge Lower Bound) to prune search states, dramatically accelerating optimal path discovery.

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
