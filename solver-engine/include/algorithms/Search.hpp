#ifndef SEARCH_HPP
#define SEARCH_HPP

#include "cube/Cube.hpp"
#include <chrono>
#include <string>
#include <vector>

enum class SearchAlgorithm {
    BFS,
    DFS,
    IDDFS,
    IDA_STAR,
    TWO_PHASE
};

enum class HeuristicType {
    NONE,
    MISPLACED_PIECES,
    CORNER_EDGE_LOWER_BOUND,
    PATTERN_DATABASE
};

struct SolveOptions {
    SearchAlgorithm algorithm = SearchAlgorithm::IDA_STAR;
    HeuristicType heuristic = HeuristicType::CORNER_EDGE_LOWER_BOUND;
    uint32_t maxDepth = 30;
    uint64_t timeoutMs = 30000;
    uint64_t memoryLimitBytes = 50 * 1024 * 1024; // 50MB default
    bool collectTrace = true;
    bool useTranspositionTable = true;
    bool enableMovePruning = true;
};

struct SolveMetrics {
    uint64_t nodesGenerated = 0;
    uint64_t nodesExpanded = 0;
    uint64_t nodesPruned = 0;
    uint64_t duplicateStates = 0;
    uint32_t maxDepthReached = 0;
    uint32_t thresholdIterations = 0;
    uint64_t elapsedMs = 0;
    uint64_t peakMemoryBytes = 0;
    bool cacheHit = false;
};

struct TraceLine {
    std::string timestamp;
    std::string type; // "info", "solve", "trace", "stats", "success", "error"
    std::string message;
};

struct SolveResult {
    std::string status; // "SOLVED", "TIMEOUT", "MEMORY_LIMIT", "INVALID_STATE", "FAILED"
    std::vector<Move> solution;
    SolveMetrics metrics;
    std::vector<TraceLine> trace;
};

#endif // SEARCH_HPP
