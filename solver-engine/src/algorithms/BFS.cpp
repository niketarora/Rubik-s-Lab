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

inline Move invertMove(Move m) {
    int base = (m / 3) * 3;
    int mod = m % 3;
    if (mod == 0) return static_cast<Move>(base + 1);
    if (mod == 1) return static_cast<Move>(base + 0);
    return m; // mod == 2 is double turn, self-inverse
}

struct BFSNode {
    CompactCube state;
    Move lastMove;
};

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

    result.trace.push_back({getTimestamp(), "info", "Starting Breadth-First Search (Bidirectional BFS)..."});

    // Frontier queues for forward and backward search
    std::queue<BFSNode> qFwd;
    std::queue<BFSNode> qBwd;

    qFwd.push({startCompact, U});
    qBwd.push({solvedCompact, U});

    // Hash maps: state -> pair(parentState, moveTaken)
    std::unordered_map<CompactCube, std::pair<CompactCube, Move>, CompactCubeHash> visitedFwd;
    std::unordered_map<CompactCube, std::pair<CompactCube, Move>, CompactCubeHash> visitedBwd;

    visitedFwd[startCompact] = {startCompact, U};
    visitedBwd[solvedCompact] = {solvedCompact, U};

    result.metrics.nodesGenerated = 2;

    CompactCube meetNode;
    bool foundIntersection = false;
    uint64_t nodeCount = 0;

    while (!qFwd.empty() && !qBwd.empty()) {
        nodeCount++;

        if (nodeCount % 1000 == 0) {
            auto curTime = std::chrono::high_resolution_clock::now();
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(curTime - startTime).count();
            if (elapsed > static_cast<int64_t>(options.timeoutMs)) {
                result.status = "TIMEOUT";
                result.metrics.elapsedMs = elapsed;
                result.trace.push_back({getTimestamp(), "error", "BFS search timed out."});
                return result;
            }

            uint64_t estMemory = (visitedFwd.size() + visitedBwd.size() + qFwd.size() + qBwd.size()) * 96;
            result.metrics.peakMemoryBytes = std::max(result.metrics.peakMemoryBytes, estMemory);
            if (estMemory > options.memoryLimitBytes) {
                result.status = "MEMORY_LIMIT";
                result.metrics.elapsedMs = elapsed;
                result.trace.push_back({getTimestamp(), "error", "BFS search exceeded memory limit."});
                return result;
            }
        }

        // Expand from smaller frontier to minimize branching factor
        bool expandFwd = qFwd.size() <= qBwd.size();

        BFSNode curr = expandFwd ? qFwd.front() : qBwd.front();
        if (expandFwd) qFwd.pop(); else qBwd.pop();
        result.metrics.nodesExpanded++;

        PieceCube currPiece = compactToPieces(curr.state);

        for (int m = 0; m < 18; ++m) {
            Move move = static_cast<Move>(m);

            // Move pruning: no back-to-back moves on same face
            if (options.enableMovePruning) {
                bool isRoot = expandFwd ? (curr.state == startCompact) : (curr.state == solvedCompact);
                if (!isRoot && (curr.lastMove / 3 == move / 3)) {
                    result.metrics.nodesPruned++;
                    continue;
                }
            }

            PieceCube nextPiece = applyMove(currPiece, move);
            CompactCube nextCompact = piecesToCompact(nextPiece);
            result.metrics.nodesGenerated++;

            if (expandFwd) {
                if (visitedFwd.find(nextCompact) != visitedFwd.end()) {
                    result.metrics.duplicateStates++;
                    continue;
                }

                visitedFwd[nextCompact] = {curr.state, move};

                // Check meeting in backward visited
                if (visitedBwd.find(nextCompact) != visitedBwd.end()) {
                    meetNode = nextCompact;
                    foundIntersection = true;
                    break;
                }

                qFwd.push({nextCompact, move});
            } else {
                if (visitedBwd.find(nextCompact) != visitedBwd.end()) {
                    result.metrics.duplicateStates++;
                    continue;
                }

                visitedBwd[nextCompact] = {curr.state, move};

                // Check meeting in forward visited
                if (visitedFwd.find(nextCompact) != visitedFwd.end()) {
                    meetNode = nextCompact;
                    foundIntersection = true;
                    break;
                }

                qBwd.push({nextCompact, move});
            }
        }

        if (foundIntersection) break;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
    uint64_t estMemory = (visitedFwd.size() + visitedBwd.size() + qFwd.size() + qBwd.size()) * 96;
    result.metrics.peakMemoryBytes = std::max(result.metrics.peakMemoryBytes, estMemory);

    if (foundIntersection) {
        result.status = "SOLVED";

        // 1. Reconstruct forward path (start -> meetNode)
        std::vector<Move> fwdPath;
        CompactCube c = meetNode;
        while (!(c == startCompact)) {
            auto parentInfo = visitedFwd[c];
            fwdPath.push_back(parentInfo.second);
            c = parentInfo.first;
        }
        std::reverse(fwdPath.begin(), fwdPath.end());

        // 2. Reconstruct backward path (meetNode -> solved)
        std::vector<Move> bwdPath;
        c = meetNode;
        while (!(c == solvedCompact)) {
            auto parentInfo = visitedBwd[c];
            bwdPath.push_back(invertMove(parentInfo.second));
            c = parentInfo.first;
        }

        result.solution = fwdPath;
        result.solution.insert(result.solution.end(), bwdPath.begin(), bwdPath.end());
        result.metrics.maxDepthReached = result.solution.size();

        std::stringstream ss;
        ss << "BFS solved optimally in " << result.solution.size() << " moves (" << result.metrics.elapsedMs << "ms).";
        result.trace.push_back({getTimestamp(), "success", ss.str()});
    } else if (result.status != "MEMORY_LIMIT" && result.status != "TIMEOUT") {
        result.trace.push_back({getTimestamp(), "error", "BFS queues exhausted. No solution exists."});
    }

    return result;
}
