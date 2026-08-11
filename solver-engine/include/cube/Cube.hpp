#ifndef CUBE_HPP
#define CUBE_HPP

#include <array>
#include <string>
#include <vector>
#include <cstdint>

// Face sticker indexes:
// U: 0-8, L: 9-17, F: 18-26, R: 27-35, B: 36-44, D: 45-53
struct StickerCube {
    std::array<uint8_t, 54> stickers;

    bool operator==(const StickerCube& other) const {
        return stickers == other.stickers;
    }
};

struct Corner {
    uint8_t permutation; // 0 to 7
    uint8_t orientation; // 0 to 2
};

struct Edge {
    uint8_t permutation; // 0 to 11
    uint8_t orientation; // 0 or 1
};

struct PieceCube {
    std::array<Corner, 8> corners;
    std::array<Edge, 12> edges;

    bool operator==(const PieceCube& other) const {
        for (int i = 0; i < 8; ++i) {
            if (corners[i].permutation != other.corners[i].permutation ||
                corners[i].orientation != other.corners[i].orientation) return false;
        }
        for (int i = 0; i < 12; ++i) {
            if (edges[i].permutation != other.edges[i].permutation ||
                edges[i].orientation != other.edges[i].orientation) return false;
        }
        return true;
    }

    bool operator!=(const PieceCube& other) const {
        return !(*this == other);
    }
};

struct CompactCube {
    uint64_t cornerPermutation;  // 8 corners, 3 bits each = 24 bits
    uint32_t cornerOrientation;  // 8 corners, 2 bits each = 16 bits
    uint64_t edgePermutation;    // 12 edges, 4 bits each = 48 bits
    uint32_t edgeOrientation;    // 12 edges, 1 bit each = 12 bits

    bool operator==(const CompactCube& other) const {
        return cornerPermutation == other.cornerPermutation &&
               cornerOrientation == other.cornerOrientation &&
               edgePermutation == other.edgePermutation &&
               edgeOrientation == other.edgeOrientation;
    }
};

// Custom Hash for CompactCube to use in std::unordered_map
struct CompactCubeHash {
    std::size_t operator()(const CompactCube& c) const {
        return c.cornerPermutation ^ c.cornerOrientation ^ c.edgePermutation ^ c.edgeOrientation;
    }
};

enum Move {
    U, U_PRIME, U2,
    D, D_PRIME, D2,
    L, L_PRIME, L2,
    R, R_PRIME, R2,
    F, F_PRIME, F2,
    B, B_PRIME, B2
};

const std::vector<std::string> MOVE_NAMES = {
    "U", "U'", "U2",
    "D", "D'", "D2",
    "L", "L'", "L2",
    "R", "R'", "R2",
    "F", "F'", "F2",
    "B", "B'", "B2"
};

// Color Conversions
uint8_t charToColor(char c);
char colorToChar(uint8_t color);

// API Conversions
StickerCube parseScramble(const std::string& scramble);
std::vector<Move> parseMoves(const std::string& movesStr);
std::string serializeMoves(const std::vector<Move>& moves);

PieceCube stickersToPieces(const StickerCube& sc);
StickerCube piecesToStickers(const PieceCube& pc);
CompactCube piecesToCompact(const PieceCube& pc);
PieceCube compactToPieces(const CompactCube& cc);

// Operations
PieceCube applyMove(const PieceCube& start, Move move);
PieceCube getSolvedCube();

// Validation
struct ValidationResult {
    bool valid;
    std::string error_code;
    std::string message;
};

ValidationResult validateCube(const StickerCube& sc);

#endif // CUBE_HPP
