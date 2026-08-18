#include "cube/Cube.hpp"
#include <sstream>
#include <algorithm>
#include <map>
#include <stdexcept>

// Solved colors for corner positions (U/D, F/B, L/R)
const uint8_t CORNER_SOLVED_COLORS[8][3] = {
    {0, 2, 1}, // 0: UFL (Yellow, Green, Orange)
    {0, 2, 3}, // 1: UFR (Yellow, Green, Red)
    {0, 4, 3}, // 2: UBR (Yellow, Blue, Red)
    {0, 4, 1}, // 3: UBL (Yellow, Blue, Orange)
    {5, 2, 1}, // 4: DFL (White, Green, Orange)
    {5, 2, 3}, // 5: DFR (White, Green, Red)
    {5, 4, 3}, // 6: DBR (White, Blue, Red)
    {5, 4, 1}  // 7: DBL (White, Blue, Orange)
};

// Solved colors for edge positions (Primary U/D or F/B, Secondary L/R or other)
const uint8_t EDGE_SOLVED_COLORS[12][2] = {
    {0, 2}, // 0: UF
    {0, 1}, // 1: UL
    {0, 4}, // 2: UB
    {0, 3}, // 3: UR
    {2, 1}, // 4: FL
    {2, 3}, // 5: FR
    {4, 1}, // 6: BL
    {4, 3}, // 7: BR
    {5, 2}, // 8: DF
    {5, 1}, // 9: DL
    {5, 4}, // 10: DB
    {5, 3}  // 11: DR
};

// Sticker indexes of the 8 corners: U/D sticker first, then F/B sticker, then L/R sticker
const int CORNER_STICKERS[8][3] = {
    {6, 18, 11},  // 0: UFL
    {8, 20, 27},  // 1: UFR
    {2, 36, 29},  // 2: UBR
    {0, 38, 9},   // 3: UBL
    {45, 24, 17}, // 4: DFL
    {47, 26, 33}, // 5: DFR
    {53, 42, 35}, // 6: DBR
    {51, 44, 15}  // 7: DBL
};

// Sticker indexes of the 12 edges: Primary first, Secondary second
const int EDGE_STICKERS[12][2] = {
    {7, 19},  // 0: UF
    {3, 10},  // 1: UL
    {1, 37},  // 2: UB
    {5, 28},  // 3: UR
    {21, 14}, // 4: FL
    {23, 30}, // 5: FR
    {41, 12}, // 6: BL
    {39, 32}, // 7: BR
    {46, 25}, // 8: DF
    {48, 16}, // 9: DL
    {52, 43}, // 10: DB
    {50, 34}  // 11: DR
};

PieceCube getSolvedCube() {
    PieceCube pc;
    for (uint8_t i = 0; i < 8; ++i) {
        pc.corners[i] = {i, 0};
    }
    for (uint8_t i = 0; i < 12; ++i) {
        pc.edges[i] = {i, 0};
    }
    return pc;
}

// Convert face character to index 0-5
uint8_t charToColor(char c) {
    switch (c) {
        case 'U': case 'Y': return 0; // Yellow
        case 'L': case 'O': return 1; // Orange
        case 'F': case 'G': return 2; // Green
        case 'R': return 3;           // Red
        case 'B': return 4;           // Blue
        case 'D': case 'W': return 5; // White
        default: return 99;
    }
}

// Convert index 0-5 to char
char colorToChar(uint8_t color) {
    switch (color) {
        case 0: return 'U';
        case 1: return 'L';
        case 2: return 'F';
        case 3: return 'R';
        case 4: return 'B';
        case 5: return 'D';
        default: return 'X';
    }
}

StickerCube parseScramble(const std::string& scramble) {
    PieceCube pc = getSolvedCube();
    std::vector<Move> moves = parseMoves(scramble);
    for (auto m : moves) {
        pc = applyMove(pc, m);
    }
    return piecesToStickers(pc);
}

std::vector<Move> parseMoves(const std::string& movesStr) {
    std::vector<Move> moves;
    std::stringstream ss(movesStr);
    std::string token;
    while (ss >> token) {
        if (token.empty()) continue;
        bool found = false;
        for (size_t i = 0; i < MOVE_NAMES.size(); ++i) {
            if (MOVE_NAMES[i] == token) {
                moves.push_back(static_cast<Move>(i));
                found = true;
                break;
            }
        }
        if (!found) {
            throw std::runtime_error("Invalid move token: " + token);
        }
    }
    return moves;
}

std::string serializeMoves(const std::vector<Move>& moves) {
    std::string s;
    for (size_t i = 0; i < moves.size(); ++i) {
        s += MOVE_NAMES[moves[i]];
        if (i < moves.size() - 1) s += " ";
    }
    return s;
}

// Identify corner piece from its 3 colors (order-independent)
uint8_t identifyCorner(uint8_t c0, uint8_t c1, uint8_t c2) {
    std::array<uint8_t, 3> colors = {c0, c1, c2};
    std::sort(colors.begin(), colors.end());
    for (uint8_t p = 0; p < 8; ++p) {
        std::array<uint8_t, 3> target = {
            CORNER_SOLVED_COLORS[p][0],
            CORNER_SOLVED_COLORS[p][1],
            CORNER_SOLVED_COLORS[p][2]
        };
        std::sort(target.begin(), target.end());
        if (colors == target) return p;
    }
    throw std::runtime_error("Invalid corner colors");
}

PieceCube stickersToPieces(const StickerCube& sc) {
    PieceCube pc;
    // Corners
    for (int i = 0; i < 8; ++i) {
        uint8_t c0 = sc.stickers[CORNER_STICKERS[i][0]]; // U/D
        uint8_t c1 = sc.stickers[CORNER_STICKERS[i][1]]; // F/B
        uint8_t c2 = sc.stickers[CORNER_STICKERS[i][2]]; // L/R
        uint8_t p = identifyCorner(c0, c1, c2);
        
        // Orientation: which slot contains the U/D color of the piece (accounting for corner chirality)
        uint8_t udColor = CORNER_SOLVED_COLORS[p][0];
        uint8_t ori = 0;
        bool isChiral = (i == 1 || i == 3 || i == 4 || i == 6);
        if (c0 == udColor) {
            ori = 0;
        } else if (c1 == udColor) {
            ori = isChiral ? 2 : 1;
        } else if (c2 == udColor) {
            ori = isChiral ? 1 : 2;
        }

        pc.corners[i] = {p, ori};
    }

    // Edges
    for (int i = 0; i < 12; ++i) {
        uint8_t e0 = sc.stickers[EDGE_STICKERS[i][0]]; // Primary
        uint8_t e1 = sc.stickers[EDGE_STICKERS[i][1]]; // Secondary

        // Identify edge piece
        std::array<uint8_t, 2> colors = {e0, e1};
        std::sort(colors.begin(), colors.end());
        uint8_t p = 99;
        for (uint8_t ep = 0; ep < 12; ++ep) {
            std::array<uint8_t, 2> target = {EDGE_SOLVED_COLORS[ep][0], EDGE_SOLVED_COLORS[ep][1]};
            std::sort(target.begin(), target.end());
            if (colors == target) {
                p = ep;
                break;
            }
        }
        if (p == 99) throw std::runtime_error("Invalid edge colors");

        // Edge primary color is U/D (if exists), else F/B
        uint8_t primaryColor = EDGE_SOLVED_COLORS[p][0];
        uint8_t ori = (e0 == primaryColor) ? 0 : 1;

        pc.edges[i] = {p, ori};
    }

    return pc;
}

StickerCube piecesToStickers(const PieceCube& pc) {
    StickerCube sc;
    // Set Center Colors (Fixed orientation centers)
    sc.stickers[4] = 0;  // U (Yellow)
    sc.stickers[13] = 1; // L (Orange)
    sc.stickers[22] = 2; // F (Green)
    sc.stickers[31] = 3; // R (Red)
    sc.stickers[40] = 4; // B (Blue)
    sc.stickers[49] = 5; // D (White)

    // Corners
    for (int i = 0; i < 8; ++i) {
        uint8_t p = pc.corners[i].permutation;
        uint8_t ori = pc.corners[i].orientation;
        uint8_t c_ud = CORNER_SOLVED_COLORS[p][0];
        uint8_t c_fb = CORNER_SOLVED_COLORS[p][1];
        uint8_t c_lr = CORNER_SOLVED_COLORS[p][2];

        if (ori == 0) {
            sc.stickers[CORNER_STICKERS[i][0]] = c_ud;
            sc.stickers[CORNER_STICKERS[i][1]] = c_fb;
            sc.stickers[CORNER_STICKERS[i][2]] = c_lr;
        } else if (ori == 1) {
            sc.stickers[CORNER_STICKERS[i][0]] = c_lr;
            sc.stickers[CORNER_STICKERS[i][1]] = c_ud;
            sc.stickers[CORNER_STICKERS[i][2]] = c_fb;
        } else {
            sc.stickers[CORNER_STICKERS[i][0]] = c_fb;
            sc.stickers[CORNER_STICKERS[i][1]] = c_lr;
            sc.stickers[CORNER_STICKERS[i][2]] = c_ud;
        }
    }

    // Edges
    for (int i = 0; i < 12; ++i) {
        uint8_t p = pc.edges[i].permutation;
        uint8_t ori = pc.edges[i].orientation;
        uint8_t c_prim = EDGE_SOLVED_COLORS[p][0];
        uint8_t c_sec = EDGE_SOLVED_COLORS[p][1];

        if (ori == 0) {
            sc.stickers[EDGE_STICKERS[i][0]] = c_prim;
            sc.stickers[EDGE_STICKERS[i][1]] = c_sec;
        } else {
            sc.stickers[EDGE_STICKERS[i][0]] = c_sec;
            sc.stickers[EDGE_STICKERS[i][1]] = c_prim;
        }
    }

    return sc;
}

CompactCube piecesToCompact(const PieceCube& pc) {
    CompactCube cc = {0, 0, 0, 0};
    for (int i = 0; i < 8; ++i) {
        cc.cornerPermutation |= (static_cast<uint64_t>(pc.corners[i].permutation) << (i * 3));
        cc.cornerOrientation |= (static_cast<uint32_t>(pc.corners[i].orientation) << (i * 2));
    }
    for (int i = 0; i < 12; ++i) {
        cc.edgePermutation |= (static_cast<uint64_t>(pc.edges[i].permutation) << (i * 4));
        cc.edgeOrientation |= (static_cast<uint32_t>(pc.edges[i].orientation) << i);
    }
    return cc;
}

PieceCube compactToPieces(const CompactCube& cc) {
    PieceCube pc;
    for (int i = 0; i < 8; ++i) {
        pc.corners[i].permutation = (cc.cornerPermutation >> (i * 3)) & 0x7;
        pc.corners[i].orientation = (cc.cornerOrientation >> (i * 2)) & 0x3;
    }
    for (int i = 0; i < 12; ++i) {
        pc.edges[i].permutation = (cc.edgePermutation >> (i * 4)) & 0xF;
        pc.edges[i].orientation = (cc.edgeOrientation >> i) & 0x1;
    }
    return pc;
}

// 6 base moves transitions
PieceCube applyBaseMove(const PieceCube& prev, Move base) {
    PieceCube next = prev;
    switch (base) {
        case U:
            // Corners: UFL(0) <- UFR(1) <- UBR(2) <- UBL(3) <- UFL(0)
            next.corners[0] = prev.corners[1];
            next.corners[3] = prev.corners[0];
            next.corners[2] = prev.corners[3];
            next.corners[1] = prev.corners[2];
            // Edges: UF(0) <- UR(3) <- UB(2) <- UL(1) <- UF(0)
            next.edges[0] = prev.edges[3];
            next.edges[1] = prev.edges[0];
            next.edges[2] = prev.edges[1];
            next.edges[3] = prev.edges[2];
            break;
            
        case D:
            // Corners: DFL(4) -> DFR(5) -> DBR(6) -> DBL(7) -> DFL(4)
            next.corners[5] = prev.corners[4];
            next.corners[6] = prev.corners[5];
            next.corners[7] = prev.corners[6];
            next.corners[4] = prev.corners[7];
            // Edges: DF(8) -> DR(11) -> DB(10) -> DL(9) -> DF(8)
            next.edges[11] = prev.edges[8];
            next.edges[10] = prev.edges[11];
            next.edges[9] = prev.edges[10];
            next.edges[8] = prev.edges[9];
            break;
            
        case L:
            // Corners: UFL(0) -> DFL(4) -> DBL(7) -> UBL(3) -> UFL(0)
            next.corners[4] = prev.corners[0]; next.corners[4].orientation = (prev.corners[0].orientation + 2) % 3;
            next.corners[7] = prev.corners[4]; next.corners[7].orientation = (prev.corners[4].orientation + 1) % 3;
            next.corners[3] = prev.corners[7]; next.corners[3].orientation = (prev.corners[7].orientation + 2) % 3;
            next.corners[0] = prev.corners[3]; next.corners[0].orientation = (prev.corners[3].orientation + 1) % 3;
            // Edges: UL(1) -> FL(4) -> DL(9) -> BL(6) -> UL(1)
            next.edges[4] = prev.edges[1];
            next.edges[9] = prev.edges[4];
            next.edges[6] = prev.edges[9];
            next.edges[1] = prev.edges[6];
            break;
            
        case R:
            // Corners: UFR(1) -> UBR(2) -> DBR(6) -> DFR(5) -> UFR(1)
            next.corners[2] = prev.corners[1]; next.corners[2].orientation = (prev.corners[1].orientation + 1) % 3;
            next.corners[6] = prev.corners[2]; next.corners[6].orientation = (prev.corners[2].orientation + 2) % 3;
            next.corners[5] = prev.corners[6]; next.corners[5].orientation = (prev.corners[6].orientation + 1) % 3;
            next.corners[1] = prev.corners[5]; next.corners[1].orientation = (prev.corners[5].orientation + 2) % 3;
            // Edges: UR(3) -> BR(7) -> DR(11) -> FR(5) -> UR(3)
            next.edges[7] = prev.edges[3];
            next.edges[11] = prev.edges[7];
            next.edges[5] = prev.edges[11];
            next.edges[3] = prev.edges[5];
            break;
            
        case F:
            // Corners: UFL(0) -> UFR(1) -> DFR(5) -> DFL(4) -> UFL(0)
            next.corners[1] = prev.corners[0]; next.corners[1].orientation = (prev.corners[0].orientation + 1) % 3;
            next.corners[5] = prev.corners[1]; next.corners[5].orientation = (prev.corners[1].orientation + 2) % 3;
            next.corners[4] = prev.corners[5]; next.corners[4].orientation = (prev.corners[5].orientation + 1) % 3;
            next.corners[0] = prev.corners[4]; next.corners[0].orientation = (prev.corners[4].orientation + 2) % 3;
            // Edges: UF(0) -> FR(5) -> DF(8) -> FL(4) -> UF(0)
            next.edges[5] = prev.edges[0]; next.edges[5].orientation = (prev.edges[0].orientation + 1) % 2;
            next.edges[8] = prev.edges[5]; next.edges[8].orientation = (prev.edges[5].orientation + 1) % 2;
            next.edges[4] = prev.edges[8]; next.edges[4].orientation = (prev.edges[8].orientation + 1) % 2;
            next.edges[0] = prev.edges[4]; next.edges[0].orientation = (prev.edges[4].orientation + 1) % 2;
            break;
            
        case B:
            // Corners: UBR(2) -> UBL(3) -> DBL(7) -> DBR(6) -> UBR(2)
            next.corners[3] = prev.corners[2]; next.corners[3].orientation = (prev.corners[2].orientation + 1) % 3;
            next.corners[7] = prev.corners[3]; next.corners[7].orientation = (prev.corners[3].orientation + 2) % 3;
            next.corners[6] = prev.corners[7]; next.corners[6].orientation = (prev.corners[7].orientation + 1) % 3;
            next.corners[2] = prev.corners[6]; next.corners[2].orientation = (prev.corners[6].orientation + 2) % 3;
            // Edges: UB(2) -> BL(6) -> DB(10) -> BR(7) -> UB(2)
            next.edges[6] = prev.edges[2]; next.edges[6].orientation = (prev.edges[2].orientation + 1) % 2;
            next.edges[10] = prev.edges[6]; next.edges[10].orientation = (prev.edges[6].orientation + 1) % 2;
            next.edges[7] = prev.edges[10]; next.edges[7].orientation = (prev.edges[10].orientation + 1) % 2;
            next.edges[2] = prev.edges[7]; next.edges[2].orientation = (prev.edges[7].orientation + 1) % 2;
            break;
            
        default:
            break;
    }
    return next;
}

PieceCube applyMove(const PieceCube& start, Move move) {
    Move base = static_cast<Move>((move / 3) * 3); // Map to U, D, L, R, F, B base
    int modifier = move % 3; // 0 = normal, 1 = prime, 2 = double

    PieceCube next = start;
    int repetitions = (modifier == 2) ? 2 : ((modifier == 1) ? 3 : 1);
    for (int i = 0; i < repetitions; ++i) {
        next = applyBaseMove(next, base);
    }
    return next;
}

ValidationResult validateCube(const StickerCube& sc) {
    ValidationResult res = {true, "", ""};

    // 1. Color counts (must be 9 of each color 0-5)
    std::array<int, 6> counts = {0};
    for (auto val : sc.stickers) {
        if (val > 5) {
            return {false, "INVALID_COLOR", "Invalid sticker color detected"};
        }
        counts[val]++;
    }
    for (int i = 0; i < 6; ++i) {
        if (counts[i] != 9) {
            return {false, "COLOR_COUNT_ERROR", "Sticker colors are not equal. Each of the 6 colors must appear exactly 9 times."};
        }
    }

    // 2. Center check (fixed centers U=0, L=1, F=2, R=3, B=4, D=5)
    if (sc.stickers[4] != 0 || sc.stickers[13] != 1 || sc.stickers[22] != 2 ||
        sc.stickers[31] != 3 || sc.stickers[40] != 4 || sc.stickers[49] != 5) {
        return {false, "INVALID_CENTERS", "Cube centers do not match the expected standard orientation."};
    }

    // 3. Piece parsing & duplicate check
    PieceCube pc;
    try {
        pc = stickersToPieces(sc);
    } catch (const std::exception& e) {
        return {false, "PIECE_INDEX_ERROR", std::string("Failed to map stickers to logical piece locations: ") + e.what()};
    }

    // Check unique corners
    std::array<bool, 8> cornerSeen = {false};
    int cornerOriSum = 0;
    for (int i = 0; i < 8; ++i) {
        uint8_t perm = pc.corners[i].permutation;
        if (cornerSeen[perm]) {
            return {false, "DUPLICATE_CORNER", "Duplicate corner piece configuration detected."};
        }
        cornerSeen[perm] = true;
        cornerOriSum += pc.corners[i].orientation;
    }

    // Check unique edges
    std::array<bool, 12> edgeSeen = {false};
    int edgeOriSum = 0;
    for (int i = 0; i < 12; ++i) {
        uint8_t perm = pc.edges[i].permutation;
        if (edgeSeen[perm]) {
            return {false, "DUPLICATE_EDGE", "Duplicate edge piece configuration detected."};
        }
        edgeSeen[perm] = true;
        edgeOriSum += pc.edges[i].orientation;
    }

    // 4. Parities checks
    // Corner orientation sum must be 0 mod 3
    if (cornerOriSum % 3 != 0) {
        return {false, "INVALID_CORNER_ORIENTATION", "Corner orientation parity violation. The sum of corner orientations is not divisible by 3."};
    }

    // Edge orientation sum must be 0 mod 2
    if (edgeOriSum % 2 != 0) {
        return {false, "INVALID_EDGE_ORIENTATION", "Edge orientation parity violation. The sum of edge orientations is not divisible by 2."};
    }

    // Permutation parity: corner permutation sign must equal edge permutation sign.
    // Calculate number of swaps to sort corners
    int cornerSwaps = 0;
    std::array<uint8_t, 8> cornersSorted;
    for (int i = 0; i < 8; ++i) cornersSorted[i] = pc.corners[i].permutation;
    for (int i = 0; i < 8; ++i) {
        for (int j = i + 1; j < 8; ++j) {
            if (cornersSorted[i] > cornersSorted[j]) {
                std::swap(cornersSorted[i], cornersSorted[j]);
                cornerSwaps++;
            }
        }
    }

    int edgeSwaps = 0;
    std::array<uint8_t, 12> edgesSorted;
    for (int i = 0; i < 12; ++i) edgesSorted[i] = pc.edges[i].permutation;
    for (int i = 0; i < 12; ++i) {
        for (int j = i + 1; j < 12; ++j) {
            if (edgesSorted[i] > edgesSorted[j]) {
                std::swap(edgesSorted[i], edgesSorted[j]);
                edgeSwaps++;
            }
        }
    }

    if ((cornerSwaps % 2) != (edgeSwaps % 2)) {
        return {false, "INVALID_PERMUTATION_PARITY", "Permutation parity violation. The permutation of corners and edges have opposite parities, making the cube unsolvable."};
    }

    return res;
}
