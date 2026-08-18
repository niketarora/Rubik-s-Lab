#include "algorithms/TwoPhase.hpp"
#include "heuristics/Heuristics.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>
#include <algorithm>
#include <queue>
#include <vector>

static std::string getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time), "%H:%M:%S");
    return ss.str();
}

// -------------------------------------------------------------
// Coordinate Encoding & Decoding
// -------------------------------------------------------------

// 1. Edge Orientation (11 independent bits -> 2048 values)
static inline uint16_t getEdgeOriCoord(const PieceCube& cube) {
    uint16_t coord = 0;
    for (int i = 0; i < 11; ++i) {
        coord = (coord << 1) | (cube.edges[i].orientation & 1);
    }
    return coord;
}

// 2. Corner Orientation (7 independent base-3 digits -> 2187 values)
static inline uint16_t getCornerOriCoord(const PieceCube& cube) {
    uint16_t coord = 0;
    for (int i = 0; i < 7; ++i) {
        coord = coord * 3 + (cube.corners[i].orientation % 3);
    }
    return coord;
}

// 3. Middle Slice Combination (which 4 of the 12 edge slots hold edges {4,5,6,7} -> C(12,4) = 495 values)
static inline uint16_t getSliceCoord(const PieceCube& cube) {
    uint16_t coord = 0;
    int k = 4;
    for (int n = 11; n >= 0 && k > 0; --n) {
        bool isSliceEdge = (cube.edges[n].permutation >= 4 && cube.edges[n].permutation <= 7);
        if (isSliceEdge) {
            int c = 1;
            for (int i = 0; i < k; ++i) {
                c = c * (n - i) / (i + 1);
            }
            coord += c;
            k--;
        }
    }
    return coord;
}

// 4. Corner Permutation (8! = 40,320 values)
static inline uint16_t getCornerPermCoord(const PieceCube& cube) {
    uint8_t p[8];
    for (int i = 0; i < 8; ++i) {
        p[i] = cube.corners[i].permutation;
    }
    static const int FACTORIAL8[8] = {1, 1, 2, 6, 24, 120, 720, 5040};
    uint16_t rank = 0;
    for (int i = 0; i < 8; ++i) {
        int count = 0;
        for (int j = i + 1; j < 8; ++j) {
            if (p[j] < p[i]) count++;
        }
        rank += count * FACTORIAL8[7 - i];
    }
    return rank;
}

// 5. UD Edge Permutation (8! = 40,320 values)
static inline uint16_t getUDEdgePermCoord(const PieceCube& cube) {
    static const int UD_SLOTS[8] = {0, 1, 2, 3, 8, 9, 10, 11};
    uint8_t p[8];
    for (int i = 0; i < 8; ++i) {
        uint8_t raw = cube.edges[UD_SLOTS[i]].permutation;
        p[i] = (raw < 4) ? raw : (raw - 4);
    }
    static const int FACTORIAL8[8] = {1, 1, 2, 6, 24, 120, 720, 5040};
    uint16_t rank = 0;
    for (int i = 0; i < 8; ++i) {
        int count = 0;
        for (int j = i + 1; j < 8; ++j) {
            if (p[j] < p[i]) count++;
        }
        rank += count * FACTORIAL8[7 - i];
    }
    return rank;
}

// 6. Slice Edge Permutation in Phase 2 (4! = 24 values)
static inline uint8_t getSlicePermCoord(const PieceCube& cube) {
    uint8_t p[4];
    for (int i = 0; i < 4; ++i) {
        p[i] = cube.edges[4 + i].permutation - 4;
    }
    static const int FACTORIAL4[4] = {1, 1, 2, 6};
    uint8_t rank = 0;
    for (int i = 0; i < 4; ++i) {
        int count = 0;
        for (int j = i + 1; j < 4; ++j) {
            if (p[j] < p[i]) count++;
        }
        rank += count * FACTORIAL4[3 - i];
    }
    return rank;
}

// Allowed moves in Phase 2: {U, U', U2, D, D', D2, R2, L2, F2, B2}
static const Move PHASE2_MOVES[10] = {
    U, U_PRIME, U2,
    D, D_PRIME, D2,
    R2, L2, F2, B2
};

// -------------------------------------------------------------
// High-Performance Combined Pruning Tables
// -------------------------------------------------------------
static std::vector<uint8_t> p1_slice_flip_table;   // 495 * 2048 = 1,013,760
static std::vector<uint8_t> p1_slice_twist_table;  // 495 * 2187 = 1,082,565
static std::vector<uint8_t> p2_corner_slice_table; // 40320 * 24 = 967,680
static std::vector<uint8_t> p2_edge_slice_table;   // 40320 * 24 = 967,680
static bool tablesInitialized = false;

static void initTables() {
    if (tablesInitialized) return;

    PieceCube solved = getSolvedCube();

    // 1. Phase 1 Slice-Flip Pruning Table (495 * 2048 = 1,013,760 entries)
    p1_slice_flip_table.assign(495 * 2048, 255);
    uint32_t start_sf = (uint32_t)getSliceCoord(solved) * 2048 + getEdgeOriCoord(solved);
    p1_slice_flip_table[start_sf] = 0;
    std::queue<PieceCube> q_sf;
    q_sf.push(solved);
    while (!q_sf.empty()) {
        PieceCube curr = q_sf.front();
        q_sf.pop();
        uint32_t curr_idx = (uint32_t)getSliceCoord(curr) * 2048 + getEdgeOriCoord(curr);
        uint8_t d = p1_slice_flip_table[curr_idx];
        if (d >= 10) continue;

        for (int m = 0; m < 18; ++m) {
            PieceCube next = applyMove(curr, static_cast<Move>(m));
            uint32_t next_idx = (uint32_t)getSliceCoord(next) * 2048 + getEdgeOriCoord(next);
            if (p1_slice_flip_table[next_idx] == 255) {
                p1_slice_flip_table[next_idx] = d + 1;
                q_sf.push(next);
            }
        }
    }

    // 2. Phase 1 Slice-Twist Pruning Table (495 * 2187 = 1,082,565 entries)
    p1_slice_twist_table.assign(495 * 2187, 255);
    uint32_t start_st = (uint32_t)getSliceCoord(solved) * 2187 + getCornerOriCoord(solved);
    p1_slice_twist_table[start_st] = 0;
    std::queue<PieceCube> q_st;
    q_st.push(solved);
    while (!q_st.empty()) {
        PieceCube curr = q_st.front();
        q_st.pop();
        uint32_t curr_idx = (uint32_t)getSliceCoord(curr) * 2187 + getCornerOriCoord(curr);
        uint8_t d = p1_slice_twist_table[curr_idx];
        if (d >= 9) continue;

        for (int m = 0; m < 18; ++m) {
            PieceCube next = applyMove(curr, static_cast<Move>(m));
            uint32_t next_idx = (uint32_t)getSliceCoord(next) * 2187 + getCornerOriCoord(next);
            if (p1_slice_twist_table[next_idx] == 255) {
                p1_slice_twist_table[next_idx] = d + 1;
                q_st.push(next);
            }
        }
    }

    // 3. Phase 2 Corner-Slice Permutation Table (40,320 * 24 = 967,680 entries)
    p2_corner_slice_table.assign(40320 * 24, 255);
    uint32_t start_cs = (uint32_t)getCornerPermCoord(solved) * 24 + getSlicePermCoord(solved);
    p2_corner_slice_table[start_cs] = 0;
    std::queue<PieceCube> q_cs;
    q_cs.push(solved);
    while (!q_cs.empty()) {
        PieceCube curr = q_cs.front();
        q_cs.pop();
        uint32_t curr_idx = (uint32_t)getCornerPermCoord(curr) * 24 + getSlicePermCoord(curr);
        uint8_t d = p2_corner_slice_table[curr_idx];
        if (d >= 14) continue;

        for (int i = 0; i < 10; ++i) {
            PieceCube next = applyMove(curr, PHASE2_MOVES[i]);
            uint32_t next_idx = (uint32_t)getCornerPermCoord(next) * 24 + getSlicePermCoord(next);
            if (p2_corner_slice_table[next_idx] == 255) {
                p2_corner_slice_table[next_idx] = d + 1;
                q_cs.push(next);
            }
        }
    }

    // 4. Phase 2 UD-Edge Slice Permutation Table (40,320 * 24 = 967,680 entries)
    p2_edge_slice_table.assign(40320 * 24, 255);
    uint32_t start_es = (uint32_t)getUDEdgePermCoord(solved) * 24 + getSlicePermCoord(solved);
    p2_edge_slice_table[start_es] = 0;
    std::queue<PieceCube> q_es;
    q_es.push(solved);
    while (!q_es.empty()) {
        PieceCube curr = q_es.front();
        q_es.pop();
        uint32_t curr_idx = (uint32_t)getUDEdgePermCoord(curr) * 24 + getSlicePermCoord(curr);
        uint8_t d = p2_edge_slice_table[curr_idx];
        if (d >= 12) continue;

        for (int i = 0; i < 10; ++i) {
            PieceCube next = applyMove(curr, PHASE2_MOVES[i]);
            uint32_t next_idx = (uint32_t)getUDEdgePermCoord(next) * 24 + getSlicePermCoord(next);
            if (p2_edge_slice_table[next_idx] == 255) {
                p2_edge_slice_table[next_idx] = d + 1;
                q_es.push(next);
            }
        }
    }

    tablesInitialized = true;
}

// -------------------------------------------------------------
// Phase 1 Heuristics & Search
// -------------------------------------------------------------
static inline bool isPhase1Goal(const PieceCube& cube) {
    for (int i = 0; i < 12; ++i) {
        if (cube.edges[i].orientation != 0) return false;
    }
    for (int i = 0; i < 8; ++i) {
        if (cube.corners[i].orientation != 0) return false;
    }
    for (int i = 4; i < 8; ++i) {
        if (cube.edges[i].permutation < 4 || cube.edges[i].permutation > 7) return false;
    }
    return true;
}

static inline uint32_t getPhase1Heuristic(const PieceCube& cube) {
    uint16_t sc = getSliceCoord(cube);
    uint16_t eo = getEdgeOriCoord(cube);
    uint16_t co = getCornerOriCoord(cube);

    uint32_t sf_idx = (uint32_t)sc * 2048 + eo;
    uint32_t st_idx = (uint32_t)sc * 2187 + co;

    uint8_t h_sf = (sf_idx < p1_slice_flip_table.size() && p1_slice_flip_table[sf_idx] != 255) ? p1_slice_flip_table[sf_idx] : 0;
    uint8_t h_st = (st_idx < p1_slice_twist_table.size() && p1_slice_twist_table[st_idx] != 255) ? p1_slice_twist_table[st_idx] : 0;

    return std::max((uint32_t)h_sf, (uint32_t)h_st);
}

static bool searchPhase1(const PieceCube& cube, uint32_t g, uint32_t threshold, uint32_t& nextThreshold,
                         std::vector<Move>& path, SolveMetrics& metrics,
                         std::chrono::high_resolution_clock::time_point startTime, uint64_t timeoutMs, bool& timeoutOccurred) {
    metrics.nodesExpanded++;
    metrics.maxDepthReached = std::max(metrics.maxDepthReached, g);

    uint32_t h = getPhase1Heuristic(cube);
    uint32_t f = g + h;

    if (f > threshold) {
        nextThreshold = std::min(nextThreshold, f);
        metrics.nodesPruned++;
        return false;
    }

    if (isPhase1Goal(cube)) {
        return true;
    }

    if (metrics.nodesExpanded % 50000 == 0) {
        auto now = std::chrono::high_resolution_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime).count();
        if (elapsed > static_cast<int64_t>(timeoutMs)) {
            timeoutOccurred = true;
            return false;
        }
    }

    for (int m = 0; m < 18; ++m) {
        Move move = static_cast<Move>(m);
        if (!path.empty()) {
            Move lastMove = path.back();
            if (lastMove / 3 == move / 3) continue;
            if (lastMove / 3 == (move / 3) + 1 && (move / 3 == 0 || move / 3 == 2 || move / 3 == 4)) continue;
        }

        path.push_back(move);
        metrics.nodesGenerated++;

        PieceCube next = applyMove(cube, move);
        if (searchPhase1(next, g + 1, threshold, nextThreshold, path, metrics, startTime, timeoutMs, timeoutOccurred)) {
            return true;
        }
        path.pop_back();
        if (timeoutOccurred) return false;
    }

    return false;
}

// -------------------------------------------------------------
// Phase 2 Heuristics & Search
// -------------------------------------------------------------
static inline uint32_t getPhase2Heuristic(const PieceCube& cube) {
    uint16_t cp = getCornerPermCoord(cube);
    uint16_t ep = getUDEdgePermCoord(cube);
    uint8_t sp = getSlicePermCoord(cube);

    uint32_t cs_idx = (uint32_t)cp * 24 + sp;
    uint32_t es_idx = (uint32_t)ep * 24 + sp;

    uint8_t h_cs = (cs_idx < p2_corner_slice_table.size() && p2_corner_slice_table[cs_idx] != 255) ? p2_corner_slice_table[cs_idx] : 0;
    uint8_t h_es = (es_idx < p2_edge_slice_table.size() && p2_edge_slice_table[es_idx] != 255) ? p2_edge_slice_table[es_idx] : 0;

    return std::max((uint32_t)h_cs, (uint32_t)h_es);
}

static bool searchPhase2(const PieceCube& cube, uint32_t g, uint32_t threshold, uint32_t& nextThreshold,
                         std::vector<Move>& path, SolveMetrics& metrics,
                         std::chrono::high_resolution_clock::time_point startTime, uint64_t timeoutMs, bool& timeoutOccurred) {
    metrics.nodesExpanded++;
    metrics.maxDepthReached = std::max(metrics.maxDepthReached, g);

    uint32_t h = getPhase2Heuristic(cube);
    uint32_t f = g + h;

    if (f > threshold) {
        nextThreshold = std::min(nextThreshold, f);
        metrics.nodesPruned++;
        return false;
    }

    if (cube == getSolvedCube()) {
        return true;
    }

    if (metrics.nodesExpanded % 50000 == 0) {
        auto now = std::chrono::high_resolution_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime).count();
        if (elapsed > static_cast<int64_t>(timeoutMs)) {
            timeoutOccurred = true;
            return false;
        }
    }

    for (int i = 0; i < 10; ++i) {
        Move move = PHASE2_MOVES[i];
        if (!path.empty()) {
            Move lastMove = path.back();
            if (lastMove / 3 == move / 3) continue;
            if (lastMove / 3 == (move / 3) + 1 && (move / 3 == 0 || move / 3 == 2 || move / 3 == 4)) continue;
        }

        path.push_back(move);
        metrics.nodesGenerated++;

        PieceCube next = applyMove(cube, move);
        if (searchPhase2(next, g + 1, threshold, nextThreshold, path, metrics, startTime, timeoutMs, timeoutOccurred)) {
            return true;
        }
        path.pop_back();
        if (timeoutOccurred) return false;
    }

    return false;
}

// -------------------------------------------------------------
// Main Two-Phase Solver Entry Point
// -------------------------------------------------------------
SolveResult runTwoPhase(const PieceCube& start, const SolveOptions& options) {
    initTables();

    SolveResult result;
    result.status = "FAILED";
    result.trace.push_back({getTimestamp(), "info", "Starting Two-Phase Kociemba Reduction search..."});

    auto startTime = std::chrono::high_resolution_clock::now();
    bool timeoutOccurred = false;

    if (start == getSolvedCube()) {
        result.status = "SOLVED";
        result.solution = {};
        result.metrics.elapsedMs = 0;
        result.trace.push_back({getTimestamp(), "success", "Cube is already solved."});
        return result;
    }

    // --- PHASE 1: Reduce G0 -> G1 ---
    std::vector<Move> path1;
    bool p1Solved = false;
    uint32_t threshold1 = getPhase1Heuristic(start);

    while (threshold1 <= 15) {
        path1.clear();
        uint32_t nextThreshold = 99999;
        result.metrics.thresholdIterations++;

        p1Solved = searchPhase1(start, 0, threshold1, nextThreshold, path1, result.metrics, startTime, options.timeoutMs, timeoutOccurred);
        if (p1Solved || timeoutOccurred || nextThreshold == 99999) break;
        threshold1 = nextThreshold;
    }

    if (!p1Solved) {
        if (timeoutOccurred) {
            result.status = "TIMEOUT";
            result.trace.push_back({getTimestamp(), "error", "Phase 1 reduction timed out."});
        } else {
            result.status = "FAILED";
            result.trace.push_back({getTimestamp(), "error", "Phase 1 reduction limit reached."});
        }
        return result;
    }

    result.trace.push_back({getTimestamp(), "trace", "Phase 1 G0->G1 reduction complete in " + std::to_string(path1.size()) + " moves."});

    // Apply Phase 1 moves to get G1 state
    PieceCube cubePhase2 = start;
    for (auto m : path1) {
        cubePhase2 = applyMove(cubePhase2, m);
    }

    // --- PHASE 2: Solve in G1 subgroup ---
    std::vector<Move> path2;
    bool p2Solved = false;
    uint32_t threshold2 = getPhase2Heuristic(cubePhase2);

    while (threshold2 <= 20) {
        path2.clear();
        uint32_t nextThreshold = 99999;
        result.metrics.thresholdIterations++;

        p2Solved = searchPhase2(cubePhase2, 0, threshold2, nextThreshold, path2, result.metrics, startTime, options.timeoutMs, timeoutOccurred);
        if (p2Solved || timeoutOccurred || nextThreshold == 99999) break;
        threshold2 = nextThreshold;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

    if (p2Solved) {
        result.status = "SOLVED";
        result.solution = path1;
        result.solution.insert(result.solution.end(), path2.begin(), path2.end());

        std::stringstream ss;
        ss << "Two-Phase search solved in " << result.solution.size() << " moves ("
           << path1.size() << " Phase 1 + " << path2.size() << " Phase 2) in "
           << result.metrics.elapsedMs << "ms.";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else if (timeoutOccurred) {
        result.status = "TIMEOUT";
        result.trace.push_back({getTimestamp(), "error", "Phase 2 solve timed out."});
    } else {
        result.status = "FAILED";
        result.trace.push_back({getTimestamp(), "error", "Phase 2 failed."});
    }

    return result;
}
