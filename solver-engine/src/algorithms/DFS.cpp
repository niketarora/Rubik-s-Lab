#include "algorithms/DFS.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>
#include <algorithm>

static std::string getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time), "%H:%M:%S");
    return ss.str();
}

bool dfsSearch(const PieceCube& cube, uint32_t depth, uint32_t limit,
              std::vector<Move>& path, SolveMetrics& metrics,
              const SolveOptions& options,
              std::chrono::high_resolution_clock::time_point startTime,
              bool& timeoutOccurred) {

    metrics.nodesExpanded++;
    metrics.maxDepthReached = std::max(metrics.maxDepthReached, depth);

    if (cube == getSolvedCube()) {
        return true;
    }

    if (depth >= limit) {
        return false;
    }

    // Check timeout every 10000 expansions
    if (metrics.nodesExpanded % 10000 == 0) {
        auto now = std::chrono::high_resolution_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime).count();
        if (elapsed > static_cast<int64_t>(options.timeoutMs)) {
            timeoutOccurred = true;
            return false;
        }
    }

    for (int m = 0; m < 18; ++m) {
        Move move = static_cast<Move>(m);

        // Move Pruning: no back-to-back rotations on the same face
        if (options.enableMovePruning && !path.empty()) {
            Move lastMove = path.back();
            if (lastMove / 3 == move / 3) {
                metrics.nodesPruned++;
                continue;
            }
        }

        path.push_back(move);
        metrics.nodesGenerated++;

        PieceCube next = applyMove(cube, move);
        if (dfsSearch(next, depth + 1, limit, path, metrics, options, startTime, timeoutOccurred)) {
            return true;
        }

        path.pop_back();

        if (timeoutOccurred) {
            return false;
        }
    }

    return false;
}

SolveResult runDFS(const PieceCube& start, const SolveOptions& options) {
    SolveResult result;
    result.status = "FAILED";
    result.trace.push_back({getTimestamp(), "info", "Starting depth-limited DFS search..."});

    auto startTime = std::chrono::high_resolution_clock::now();
    bool timeoutOccurred = false;
    std::vector<Move> path;

    bool solved = dfsSearch(start, 0, options.maxDepth, path, result.metrics, options, startTime, timeoutOccurred);

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

    // Memory footprint for recursive DFS is stack depth, negligible
    result.metrics.peakMemoryBytes = options.maxDepth * sizeof(PieceCube);

    if (solved) {
        result.status = "SOLVED";
        result.solution = path;
        std::stringstream ss;
        ss << "DFS solved in " << path.size() << " moves (non-optimal).";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else if (timeoutOccurred) {
        result.status = "TIMEOUT";
        result.trace.push_back({getTimestamp(), "error", "DFS timed out."});
    } else {
        result.trace.push_back({getTimestamp(), "error", "DFS failed to find a solution within depth limit."});
    }

    return result;
}
