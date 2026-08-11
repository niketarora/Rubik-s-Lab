#include "cube/Cube.hpp"
#include "algorithms/Search.hpp"
#include "algorithms/BFS.hpp"
#include "algorithms/DFS.hpp"
#include "algorithms/IDDFS.hpp"
#include "algorithms/IDAStar.hpp"
#include "heuristics/Heuristics.hpp"

#include <nlohmann/json.hpp>
#include <iostream>
#include <string>
#include <vector>
#include <chrono>

using json = nlohmann::json;

// Helper: map string to SearchAlgorithm
SearchAlgorithm parseAlgoStr(const std::string& s) {
    if (s == "BFS") return SearchAlgorithm::BFS;
    if (s == "DFS") return SearchAlgorithm::DFS;
    if (s == "IDDFS") return SearchAlgorithm::IDDFS;
    return SearchAlgorithm::IDA_STAR;
}

// Helper: map string to HeuristicType
HeuristicType parseHeurStr(const std::string& s) {
    if (s == "MISPLACED_PIECES") return HeuristicType::MISPLACED_PIECES;
    if (s == "CORNER_EDGE_LOWER_BOUND") return HeuristicType::CORNER_EDGE_LOWER_BOUND;
    if (s == "PATTERN_DATABASE") return HeuristicType::PATTERN_DATABASE;
    return HeuristicType::NONE;
}

// Map Move to string representation (standard notation)
std::string moveToString(Move m) {
    return MOVE_NAMES[m];
}

// Verify the solution by applying it to the start state and checking if it's solved
bool verifySolution(const PieceCube& start, const std::vector<Move>& solution) {
    PieceCube curr = start;
    for (auto m : solution) {
        curr = applyMove(curr, m);
    }
    return curr == getSolvedCube();
}

void runDaemonMode() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        try {
            auto req = json::parse(line);
            std::string requestId = req.value("requestId", "unknown_job");
            std::string cubeStateStr = req.value("cubeState", "");
            std::string algoStr = req.value("algorithm", "IDA_STAR");
            std::string heurStr = req.value("heuristic", "CORNER_EDGE_LOWER_BOUND");
            uint32_t maxDepth = req.value("maxDepth", 30);
            uint64_t timeoutMs = req.value("timeoutMs", 30000);
            bool collectTrace = req.value("collectTrace", true);

            // Parse state
            if (cubeStateStr.length() != 54) {
                json errRes = {
                    {"requestId", requestId},
                    {"status", "INVALID_STATE"},
                    {"message", "Invalid cubeState length. Must be exactly 54 characters."},
                    {"solverVersion", "cpp-2.0.0"}
                };
                std::cout << errRes.dump() << std::endl;
                continue;
            }

            StickerCube sc;
            for (int i = 0; i < 54; ++i) {
                sc.stickers[i] = charToColor(cubeStateStr[i]);
            }

            // Validate cube
            ValidationResult valRes = validateCube(sc);
            if (!valRes.valid) {
                json errRes = {
                    {"requestId", requestId},
                    {"status", "INVALID_STATE"},
                    {"message", valRes.message},
                    {"errorCode", valRes.error_code},
                    {"solverVersion", "cpp-2.0.0"}
                };
                std::cout << errRes.dump() << std::endl;
                continue;
            }

            PieceCube pc = stickersToPieces(sc);

            // Configure solve options
            SolveOptions options;
            options.algorithm = parseAlgoStr(algoStr);
            options.heuristic = parseHeurStr(heurStr);
            options.maxDepth = maxDepth;
            options.timeoutMs = timeoutMs;
            options.collectTrace = collectTrace;

            // Run search
            SolveResult res;
            if (options.algorithm == SearchAlgorithm::BFS) {
                res = runBFS(pc, options);
            } else if (options.algorithm == SearchAlgorithm::DFS) {
                res = runDFS(pc, options);
            } else if (options.algorithm == SearchAlgorithm::IDDFS) {
                res = runIDDFS(pc, options);
            } else {
                res = runIDAStar(pc, options);
            }

            // Verify solution if solved
            if (res.status == "SOLVED") {
                bool isCorrect = verifySolution(pc, res.solution);
                if (!isCorrect) {
                    res.status = "FAILED";
                    res.solution.clear();
                    res.trace.push_back({"", "error", "Solution verification failed. Solved state not reached."});
                }
            }

            // Map solution moves to standard strings
            std::vector<std::string> solutionMoves;
            for (auto m : res.solution) {
                solutionMoves.push_back(moveToString(m));
            }

            // Collated trace logs
            json traceArray = json::array();
            for (auto t : res.trace) {
                traceArray.push_back({
                    {"timestamp", t.timestamp},
                    {"type", t.type},
                    {"message", t.message}
                });
            }

            json resJson = {
                {"requestId", requestId},
                {"status", res.status},
                {"solution", solutionMoves},
                {"metrics", {
                    {"nodesGenerated", res.metrics.nodesGenerated},
                    {"nodesExpanded", res.metrics.nodesExpanded},
                    {"nodesPruned", res.metrics.nodesPruned},
                    {"duplicateStates", res.metrics.duplicateStates},
                    {"maxDepthReached", res.metrics.maxDepthReached},
                    {"thresholdIterations", res.metrics.thresholdIterations},
                    {"elapsedMs", res.metrics.elapsedMs},
                    {"peakMemoryBytes", res.metrics.peakMemoryBytes}
                }},
                {"trace", traceArray},
                {"solverVersion", "cpp-2.0.0"}
            };

            std::cout << resJson.dump() << std::endl;

        } catch (const std::exception& e) {
            json errRes = {
                {"status", "SOLVER_CRASHED"},
                {"message", std::string("Internal solver exception: ") + e.what()},
                {"solverVersion", "cpp-2.0.0"}
            };
            std::cout << errRes.dump() << std::endl;
        }
    }
}

void printUsage() {
    std::cout << "Usage: rubiks_solver [OPTIONS]\n"
              << "Options:\n"
              << "  --scramble \"MOVE_LIST\"   Scramble string (e.g. \"R U R' F2\")\n"
              << "  --algorithm ALGO       Solver algorithm (BFS, DFS, IDDFS, IDA_STAR)\n"
              << "  --heuristic HEUR       IDA* heuristic (MISPLACED_PIECES, CORNER_EDGE_LOWER_BOUND)\n"
              << "  --maxDepth DEPTH       Maximum depth limit (default: 30)\n"
              << "  --timeout SEC          Timeout limit in seconds (default: 30)\n"
              << "  --daemon               Enable JSON Lines stdin/stdout daemon mode (default when no args)\n";
}

int main(int argc, char* argv[]) {
    // Daemon mode by default when no args are passed
    if (argc == 1) {
        runDaemonMode();
        return 0;
    }

    std::string scramble = "";
    std::string algorithm = "IDA_STAR";
    std::string heuristic = "CORNER_EDGE_LOWER_BOUND";
    uint32_t maxDepth = 30;
    uint64_t timeoutMs = 30000;
    bool daemonMode = false;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--help" || arg == "-h") {
            printUsage();
            return 0;
        } else if (arg == "--daemon") {
            daemonMode = true;
        } else if (arg == "--scramble" && i + 1 < argc) {
            scramble = argv[++i];
        } else if (arg == "--algorithm" && i + 1 < argc) {
            algorithm = argv[++i];
        } else if (arg == "--heuristic" && i + 1 < argc) {
            heuristic = argv[++i];
        } else if (arg == "--maxDepth" && i + 1 < argc) {
            maxDepth = std::stoi(argv[++i]);
        } else if (arg == "--timeout" && i + 1 < argc) {
            timeoutMs = std::stoull(argv[++i]) * 1000;
        }
    }

    if (daemonMode) {
        runDaemonMode();
        return 0;
    }

    if (scramble.empty()) {
        std::cerr << "Error: --scramble is required in CLI mode.\n";
        printUsage();
        return 1;
    }

    try {
        StickerCube sc = parseScramble(scramble);
        ValidationResult valRes = validateCube(sc);
        if (!valRes.valid) {
            std::cerr << "Invalid Cube State: " << valRes.message << " (Code: " << valRes.error_code << ")\n";
            return 1;
        }

        PieceCube pc = stickersToPieces(sc);

        SolveOptions options;
        options.algorithm = parseAlgoStr(algorithm);
        options.heuristic = parseHeurStr(heuristic);
        options.maxDepth = maxDepth;
        options.timeoutMs = timeoutMs;
        options.collectTrace = true;

        std::cout << "Solver initialized in CLI mode.\n"
                  << "Scramble: " << scramble << "\n"
                  << "Algorithm: " << algorithm << "\n"
                  << "Heuristic: " << heuristic << "\n\n";

        SolveResult res;
        if (options.algorithm == SearchAlgorithm::BFS) {
            res = runBFS(pc, options);
        } else if (options.algorithm == SearchAlgorithm::DFS) {
            res = runDFS(pc, options);
        } else if (options.algorithm == SearchAlgorithm::IDDFS) {
            res = runIDDFS(pc, options);
        } else {
            res = runIDAStar(pc, options);
        }

        if (res.status == "SOLVED") {
            bool isCorrect = verifySolution(pc, res.solution);
            if (!isCorrect) {
                std::cout << "Status: SOLUTION_VERIFICATION_FAILED\n";
                return 1;
            }
            std::cout << "Status: SOLVED\n";
            std::cout << "Solution: " << serializeMoves(res.solution) << "\n";
            std::cout << "Solution Length: " << res.solution.size() << " moves\n";
        } else {
            std::cout << "Status: " << res.status << "\n";
        }

        std::cout << "\n--- Search Metrics ---\n"
                  << "Nodes Generated: " << res.metrics.nodesGenerated << "\n"
                  << "Nodes Expanded: " << res.metrics.nodesExpanded << "\n"
                  << "Nodes Pruned: " << res.metrics.nodesPruned << "\n"
                  << "Duplicate States: " << res.metrics.duplicateStates << "\n"
                  << "Max Depth Reached: " << res.metrics.maxDepthReached << "\n"
                  << "Cost Threshold Iterations: " << res.metrics.thresholdIterations << "\n"
                  << "Elapsed Time: " << res.metrics.elapsedMs << " ms\n"
                  << "Peak Memory: " << res.metrics.peakMemoryBytes << " bytes\n";

    } catch (const std::exception& e) {
        std::cerr << "Solver encountered exception: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
