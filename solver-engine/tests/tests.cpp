#include "cube/Cube.hpp"
#include "algorithms/Search.hpp"
#include "algorithms/BFS.hpp"
#include "algorithms/DFS.hpp"
#include "algorithms/IDDFS.hpp"
#include "algorithms/IDAStar.hpp"
#include "heuristics/Heuristics.hpp"

#include <iostream>
#include <cassert>
#include <vector>
#include <string>

// Test utility: assert check with description
void assert_test(bool condition, const std::string& description) {
    if (condition) {
        std::cout << "[ OK ] " << description << "\n";
    } else {
        std::cerr << "[ FAIL ] " << description << "\n";
        std::exit(1);
    }
}

void testMoveEngine() {
    std::cout << "\n--- Running Move Engine Tests ---\n";

    PieceCube solved = getSolvedCube();

    // Check U move and inverse U'
    PieceCube uCube = applyMove(solved, U);
    assert_test(uCube != solved, "U move modifies solved cube state");
    PieceCube uPrimeCube = applyMove(uCube, U_PRIME);
    assert_test(uPrimeCube == solved, "U followed by U' restores solved state");

    // Check L move and inverse L'
    PieceCube lCube = applyMove(solved, L);
    PieceCube lPrimeCube = applyMove(lCube, L_PRIME);
    assert_test(lPrimeCube == solved, "L followed by L' restores solved state");

    // Check F move and inverse F'
    PieceCube fCube = applyMove(solved, F);
    PieceCube fPrimeCube = applyMove(fCube, F_PRIME);
    assert_test(fPrimeCube == solved, "F followed by F' restores solved state");

    // Check double moves: U2 is same as U + U
    PieceCube u2Cube = applyMove(solved, U2);
    PieceCube uuCube = applyMove(applyMove(solved, U), U);
    assert_test(u2Cube == uuCube, "U2 is equivalent to applying U twice");

    // Check complex sequence inverses: (R U R' U') -> inverse is (U R U' R')
    PieceCube step1 = applyMove(solved, R);
    step1 = applyMove(step1, U);
    step1 = applyMove(step1, R_PRIME);
    step1 = applyMove(step1, U_PRIME);

    PieceCube step2 = applyMove(step1, U);
    step2 = applyMove(step2, R);
    step2 = applyMove(step2, U_PRIME);
    step2 = applyMove(step2, R_PRIME);
    assert_test(step2 == solved, "Applying inverse sequence U R U' R' restores solved state");
}

void testValidation() {
    std::cout << "\n--- Running Validation Tests ---\n";

    PieceCube solvedPiece = getSolvedCube();
    StickerCube solvedStickers = piecesToStickers(solvedPiece);

    // Solved cube must be valid
    ValidationResult valSolved = validateCube(solvedStickers);
    assert_test(valSolved.valid, "Solved cube is valid");

    // Modify a center sticker: should fail center check
    StickerCube invalidCenter = solvedStickers;
    std::swap(invalidCenter.stickers[4], invalidCenter.stickers[13]); // Swap U and L centers
    ValidationResult valCenter = validateCube(invalidCenter);
    assert_test(!valCenter.valid && valCenter.error_code == "INVALID_CENTERS", "Detects invalid center color placement");

    // Modify corner orientation: twist UFL corner (position 0)
    PieceCube twistedCorner = solvedPiece;
    twistedCorner.corners[0].orientation = 1;
    StickerCube twistedCornerStickers = piecesToStickers(twistedCorner);
    ValidationResult valTwisted = validateCube(twistedCornerStickers);
    assert_test(!valTwisted.valid && valTwisted.error_code == "INVALID_CORNER_ORIENTATION", "Detects twisted corner parity violation");

    // Modify edge orientation: flip UF edge (position 0)
    PieceCube flippedEdge = solvedPiece;
    flippedEdge.edges[0].orientation = 1;
    StickerCube flippedEdgeStickers = piecesToStickers(flippedEdge);
    ValidationResult valFlipped = validateCube(flippedEdgeStickers);
    assert_test(!valFlipped.valid && valFlipped.error_code == "INVALID_EDGE_ORIENTATION", "Detects flipped edge orientation parity violation");

    // Permutation parity swap: swap UFL (0) and UFR (1) corners
    PieceCube swappedCorners = solvedPiece;
    std::swap(swappedCorners.corners[0].permutation, swappedCorners.corners[1].permutation);
    StickerCube swappedStickers = piecesToStickers(swappedCorners);
    ValidationResult valSwapped = validateCube(swappedStickers);
    assert_test(!valSwapped.valid && valSwapped.error_code == "INVALID_PERMUTATION_PARITY", "Detects single swap permutation parity violation");
}

void testSolvers() {
    std::cout << "\n--- Running Solver Search Tests ---\n";

    PieceCube solved = getSolvedCube();

    // 3-move scramble: R U F
    PieceCube scrambled = applyMove(solved, R);
    scrambled = applyMove(scrambled, U);
    scrambled = applyMove(scrambled, F);

    SolveOptions options;
    options.maxDepth = 10;
    options.timeoutMs = 5000;
    options.collectTrace = false;

    // Test BFS Solver
    SolveResult bfsRes = runBFS(scrambled, options);
    assert_test(bfsRes.status == "SOLVED", "BFS solves 3-move scramble");
    assert_test(bfsRes.solution.size() == 3, "BFS finds optimal 3-move path");

    // Test DFS Solver (not guaranteed optimal, but should solve)
    SolveResult dfsRes = runDFS(scrambled, options);
    assert_test(dfsRes.status == "SOLVED", "DFS solves 3-move scramble");

    // Test IDDFS Solver
    SolveResult iddfsRes = runIDDFS(scrambled, options);
    assert_test(iddfsRes.status == "SOLVED", "IDDFS solves 3-move scramble");
    assert_test(iddfsRes.solution.size() == 3, "IDDFS finds optimal 3-move path");

    // Test IDA* Solver
    options.heuristic = HeuristicType::CORNER_EDGE_LOWER_BOUND;
    SolveResult idaRes = runIDAStar(scrambled, options);
    assert_test(idaRes.status == "SOLVED", "IDA* solves 3-move scramble");
    assert_test(idaRes.solution.size() == 3, "IDA* finds optimal 3-move path");
}

int main() {
    std::cout << "Starting C++ Unit Test Runner...\n";
    testMoveEngine();
    testValidation();
    testSolvers();
    std::cout << "\n[ SUCCESS ] All C++ unit tests passed successfully!\n";
    return 0;
}
