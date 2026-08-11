#include "algorithms/IDAStar.hpp"
#include "heuristics/Heuristics.hpp"
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

bool idaSearch(const PieceCube& cube, uint32_t g, uint32_t threshold, uint32_t& nextThreshold,
               std::vector<Move>& path, SolveMetrics& metrics, const SolveOptions& options,
               HeuristicType heuristicType, std::chrono::high_resolution_clock::time_point startTime,
               bool& timeoutOccurred) {
    
    metrics.nodesExpanded++;
    metrics.maxDepthReached = std::max(metrics.maxDepthReached, g);

    uint32_t h = getHeuristicValue(cube, heuristicType);
    uint32_t f = g + h;

    if (f > threshold) {
        nextThreshold = std::min(nextThreshold, f);
        metrics.nodesPruned++;
        return false;
    }

    if (cube == getSolvedCube()) {
        return true;
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

    bool solved = false;
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
        if (idaSearch(next, g + 1, threshold, nextThreshold, path, metrics, options,
                      heuristicType, startTime, timeoutOccurred)) {
            solved = true;
            break;
        }

        path.pop_back();

        if (timeoutOccurred) {
            break;
        }
    }

    return solved;
}

SolveResult runIDAStar(const PieceCube& start, const SolveOptions& options) {
    SolveResult result;
    result.status = "FAILED";
    result.trace.push_back({getTimestamp(), "info", "Starting IDA* search..."});

    auto startTime = std::chrono::high_resolution_clock::now();
    bool timeoutOccurred = false;

    uint32_t threshold = getHeuristicValue(start, options.heuristic);
    
    std::vector<Move> path;
    bool solved = false;

    while (threshold <= options.maxDepth) {
        path.clear();
        uint32_t nextThreshold = 99999; // infinity

        if (options.collectTrace) {
            std::stringstream ss;
            ss << "IDA* Iteration cost threshold = " << threshold << ". Searching...";
            result.trace.push_back({getTimestamp(), "trace", ss.str()});
        }

        result.metrics.thresholdIterations++;

        solved = idaSearch(start, 0, threshold, nextThreshold, path, result.metrics, options,
                           options.heuristic, startTime, timeoutOccurred);

        if (solved) {
            break;
        }

        if (timeoutOccurred) {
            break;
        }

        if (nextThreshold == 99999) {
            // Entire state space searched up to threshold and no path found
            break;
        }

        threshold = nextThreshold;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
    result.metrics.peakMemoryBytes = threshold * sizeof(PieceCube);

    if (solved) {
        result.status = "SOLVED";
        result.solution = path;
        std::stringstream ss;
        ss << "IDA* solved optimally in " << path.size() << " moves.";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else if (timeoutOccurred) {
        result.status = "TIMEOUT";
        result.trace.push_back({getTimestamp(), "error", "IDA* timed out."});
    } else {
        result.trace.push_back({getTimestamp(), "error", "IDA* failed to find a solution within max depth limit."});
    }

    return result;
}
