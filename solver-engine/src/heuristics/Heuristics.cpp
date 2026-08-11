#include "heuristics/Heuristics.hpp"
#include <algorithm>
#include <cmath>

// 3D coordinates of corner slots: UFL, UFR, UBR, UBL, DFL, DFR, DBR, DBL
const int CORNER_COORDS[8][3] = {
    {-1,  1,  1}, // 0: UFL
    { 1,  1,  1}, // 1: UFR
    { 1, -1,  1}, // 2: UBR
    {-1, -1,  1}, // 3: UBL
    {-1,  1, -1}, // 4: DFL
    { 1,  1, -1}, // 5: DFR
    { 1, -1, -1}, // 6: DBR
    {-1, -1, -1}  // 7: DBL
};

// 3D coordinates of edge slots: UF, UL, UB, UR, FL, FR, BL, BR, DF, DL, DB, DR
const int EDGE_COORDS[12][3] = {
    { 0,  1,  1}, // 0: UF
    {-1,  0,  1}, // 1: UL
    { 0, -1,  1}, // 2: UB
    { 1,  0,  1}, // 3: UR
    {-1,  1,  0}, // 4: FL
    { 1,  1,  0}, // 5: FR
    {-1, -1,  0}, // 6: BL
    { 1, -1,  0}, // 7: BR
    { 0,  1, -1}, // 8: DF
    {-1,  0, -1}, // 9: DL
    { 0, -1, -1}, // 10: DB
    { 1,  0, -1}  // 11: DR
};

static uint32_t misplacedPieces(const PieceCube& cube) {
    uint32_t misplacedCorners = 0;
    uint32_t misplacedEdges = 0;

    for (int i = 0; i < 8; ++i) {
        if (cube.corners[i].permutation != i || cube.corners[i].orientation != 0) {
            misplacedCorners++;
        }
    }

    for (int i = 0; i < 12; ++i) {
        if (cube.edges[i].permutation != i || cube.edges[i].orientation != 0) {
            misplacedEdges++;
        }
    }

    // A single move can correct at most 4 corners and 4 edges
    uint32_t h_corners = (misplacedCorners + 3) / 4;
    uint32_t h_edges = (misplacedEdges + 3) / 4;

    return std::max(h_corners, h_edges);
}

static uint32_t cornerEdgeLowerBound(const PieceCube& cube) {
    uint32_t sumCornerDist = 0;
    uint32_t sumEdgeDist = 0;

    // Corner Hamming distances in 3D coordinate space
    for (int i = 0; i < 8; ++i) {
        uint8_t p = cube.corners[i].permutation;
        if (i == p) {
            if (cube.corners[i].orientation != 0) {
                sumCornerDist += 2; // Needs at least 2 turns to flip in-place
            }
        } else {
            // Hamming distance of coordinates
            int dist = (CORNER_COORDS[i][0] != CORNER_COORDS[p][0]) +
                       (CORNER_COORDS[i][1] != CORNER_COORDS[p][1]) +
                       (CORNER_COORDS[i][2] != CORNER_COORDS[p][2]);
            
            // Add 1 if orientation is wrong
            if (cube.corners[i].orientation != 0) {
                dist += 1;
            }
            sumCornerDist += dist;
        }
    }

    // Edge Hamming distances
    for (int i = 0; i < 12; ++i) {
        uint8_t p = cube.edges[i].permutation;
        if (i == p) {
            if (cube.edges[i].orientation != 0) {
                sumEdgeDist += 2; // Needs at least 2 turns to flip orientation in-place
            }
        } else {
            int dist = (EDGE_COORDS[i][0] != EDGE_COORDS[p][0]) +
                       (EDGE_COORDS[i][1] != EDGE_COORDS[p][1]) +
                       (EDGE_COORDS[i][2] != EDGE_COORDS[p][2]);
            if (cube.edges[i].orientation != 0) {
                dist += 1;
            }
            sumEdgeDist += dist;
        }
    }

    // Since a single move rotates 4 corners and 4 edges
    uint32_t h_corners = (sumCornerDist + 3) / 4;
    uint32_t h_edges = (sumEdgeDist + 3) / 4;

    return std::max(h_corners, h_edges);
}

uint32_t getHeuristicValue(const PieceCube& cube, HeuristicType type) {
    switch (type) {
        case HeuristicType::MISPLACED_PIECES:
            return misplacedPieces(cube);
        case HeuristicType::CORNER_EDGE_LOWER_BOUND:
            return cornerEdgeLowerBound(cube);
        case HeuristicType::PATTERN_DATABASE:
            // Fallback to CornerEdgeLowerBound for MVP since PatternDatabase is optional/Phase 8
            return cornerEdgeLowerBound(cube);
        case HeuristicType::NONE:
        default:
            return 0;
    }
}
