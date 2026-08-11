#include "algorithms/BFS.hpp"
#include <queue>
#include <unordered_map>
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

SolveResult runBFS(const PieceCube& start, const SolveOptions& options) {
    SolveResult result;
    result.status = "FAILED";
    
    auto startTime = std::chrono::high_resolution_clock::now();

    CompactCube startCompact = piecesToCompact(start);
    CompactCube solvedCompact = piecesToCompact(getSolvedCube());

    if (startCompact == solvedCompact) {
        result.status = "SOLVED";
        result.metrics.elapsedMs = 0;
        result.metrics.maxDepthReached = 0;
        result.trace.push_back({getTimestamp(), "success", "Cube is already solved."});
        return result;
    }

    result.trace.push_back({getTimestamp(), "info", "Starting BFS search..."});

    // BFS queue
    std::queue<CompactCube> q;
    q.push(startCompact);

    // Map: current -> pair(parent, move_taken)
    std::unordered_map<CompactCube, std::pair<CompactCube, Move>, CompactCubeHash> visited;
    // For start node, parent is itself, move is dummy U (won't be read)
    visited[startCompact] = {startCompact, U};

    result.metrics.nodesGenerated = 1;

    bool solved = false;
    CompactCube finalSolvedNode;

    uint64_t nodeCount = 0;
    while (!q.empty()) {
        nodeCount++;
        
        // Timeout check every 1000 nodes
        if (nodeCount % 1000 == 0) {
            auto curTime = std::chrono::high_resolution_clock::now();
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(curTime - startTime).count();
            if (elapsed > static_cast<int64_t>(options.timeoutMs)) {
                result.status = "TIMEOUT";
                result.metrics.elapsedMs = elapsed;
                result.trace.push_back({getTimestamp(), "error", "BFS search timed out."});
                return result;
            }

            // Memory limit check: estimate ~96 bytes per node in visited map + queue
            uint64_t estMemory = (visited.size() + q.size()) * 96;
            result.metrics.peakMemoryBytes = std::max(result.metrics.peakMemoryBytes, estMemory);
            if (estMemory > options.memoryLimitBytes) {
                result.status = "MEMORY_LIMIT";
                result.metrics.elapsedMs = elapsed;
                result.trace.push_back({getTimestamp(), "error", "BFS search exceeded memory limit."});
                return result;
            }
        }

        CompactCube currCompact = q.front();
        q.pop();
        result.metrics.nodesExpanded++;

        PieceCube currPiece = compactToPieces(currCompact);

        // Try all 18 moves
        for (int m = 0; m < 18; ++m) {
            Move move = static_cast<Move>(m);
            
            // Move pruning logic: if parent move is inverse, skip it to reduce branching
            if (options.enableMovePruning && currCompact == startCompact) {
                // No parent yet, no pruning on root
            } else if (options.enableMovePruning) {
                auto parentInfo = visited[currCompact];
                Move lastMove = parentInfo.second;
                if (lastMove / 3 == move / 3) {
                    result.metrics.nodesPruned++;
                    continue;
                }
            }

            PieceCube nextPiece = applyMove(currPiece, move);
            CompactCube nextCompact = piecesToCompact(nextPiece);
            result.metrics.nodesGenerated++;

            if (visited.find(nextCompact) != visited.end()) {
                result.metrics.duplicateStates++;
                continue;
            }

            visited[nextCompact] = {currCompact, move};
            
            if (nextCompact == solvedCompact) {
                solved = true;
                finalSolvedNode = nextCompact;
                break;
            }

            q.push(nextCompact);
        }

        if (solved) break;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
    
    // Estimate final memory
    uint64_t estMemory = (visited.size() + q.size()) * 96;
    result.metrics.peakMemoryBytes = std::max(result.metrics.peakMemoryBytes, estMemory);

    if (solved) {
        result.status = "SOLVED";
        // Reconstruct path
        std::vector<Move> path;
        CompactCube curr = finalSolvedNode;
        while (!(curr == startCompact)) {
            auto parentInfo = visited[curr];
            path.push_back(parentInfo.second);
            curr = parentInfo.first;
        }
        std::reverse(path.begin(), path.end());
        result.solution = path;
        result.metrics.maxDepthReached = path.size();
        
        std::stringstream ss;
        ss << "BFS solved optimally in " << path.size() << " moves.";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else {
        result.trace.push_back({getTimestamp(), "error", "BFS queue exhausted. No solution exists."});
    }

    return result;
}
