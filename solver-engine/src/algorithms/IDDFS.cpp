#include "algorithms/IDDFS.hpp"
#include "algorithms/DFS.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>

static std::string getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time), "%H:%M:%S");
    return ss.str();
}

SolveResult runIDDFS(const PieceCube& start, const SolveOptions& options) {
    SolveResult result;
    result.status = "FAILED";
    result.trace.push_back({getTimestamp(), "info", "Starting IDDFS search..."});

    auto startTime = std::chrono::high_resolution_clock::now();
    bool timeoutOccurred = false;
    
    std::vector<Move> path;
    bool solved = false;
    
    for (uint32_t limit = 0; limit <= options.maxDepth; ++limit) {
        path.clear();
        
        if (options.collectTrace) {
            std::stringstream ss;
            ss << "IDDFS Iteration depth limit = " << limit << ". Searching...";
            result.trace.push_back({getTimestamp(), "trace", ss.str()});
        }

        result.metrics.thresholdIterations++;

        // Run depth-limited search
        solved = dfsSearch(start, 0, limit, path, result.metrics, options, startTime, timeoutOccurred);

        if (solved || timeoutOccurred) {
            break;
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
    result.metrics.peakMemoryBytes = options.maxDepth * sizeof(PieceCube);

    if (solved) {
        result.status = "SOLVED";
        result.solution = path;
        std::stringstream ss;
        ss << "IDDFS solved optimally in " << path.size() << " moves.";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else if (timeoutOccurred) {
        result.status = "TIMEOUT";
        result.trace.push_back({getTimestamp(), "error", "IDDFS timed out."});
    } else {
        result.trace.push_back({getTimestamp(), "error", "IDDFS failed to find a solution within max depth limit."});
    }

    return result;
}
