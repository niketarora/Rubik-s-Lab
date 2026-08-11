#ifndef DFS_HPP
#define DFS_HPP

#include "algorithms/Search.hpp"

SolveResult runDFS(const PieceCube& start, const SolveOptions& options);

bool dfsSearch(const PieceCube& cube, uint32_t depth, uint32_t limit,
              std::vector<Move>& path, SolveMetrics& metrics,
              const SolveOptions& options,
              std::chrono::high_resolution_clock::time_point startTime,
              bool& timeoutOccurred);

#endif // DFS_HPP
