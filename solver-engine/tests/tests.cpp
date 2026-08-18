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

#include "algorithms/TwoPhase.hpp"

// Test Two-Phase solver
void testTwoPhase() {
    std::cout << "\n--- Running Two-Phase Solver Tests ---\n";

    PieceCube solved = getSolvedCube();

    // 1. Solved cube: should return in 0 moves
    SolveOptions options;
    options.timeoutMs = 5000;
    options.collectTrace = false;

    SolveResult zeroRes = runTwoPhase(solved, options);
    assert_test(zeroRes.status == "SOLVED" && zeroRes.solution.empty(), "Two-Phase returns empty solution for solved cube");

    // 2. Short scramble: R U R' F2
    PieceCube shortCube = applyMove(solved, R);
    shortCube = applyMove(shortCube, U);
    shortCube = applyMove(shortCube, R_PRIME);
    shortCube = applyMove(shortCube, F2);

    SolveResult shortRes = runTwoPhase(shortCube, options);
    assert_test(shortRes.status == "SOLVED", "Two-Phase solves short scramble");

    // Verify solution by applying moves
    PieceCube verifyCube = shortCube;
    for (auto m : shortRes.solution) {
        verifyCube = applyMove(verifyCube, m);
    }
    assert_test(verifyCube == solved, "Two-Phase short scramble solution reaches solved state");

    // 3. Deep 20-move scramble
    // Moves: U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2
    Move deepMoves[] = {U, R2, F, B, R, B2, R, U2, L, B2, R, U_PRIME, D_PRIME, R2, F, R_PRIME, L, B2, U2, F2};
    PieceCube deepCube = solved;
    for (auto m : deepMoves) {
        deepCube = applyMove(deepCube, m);
    }

    SolveResult deepRes = runTwoPhase(deepCube, options);
    assert_test(deepRes.status == "SOLVED", "Two-Phase solves deep 20-move scramble");
    assert_test(deepRes.solution.size() <= 26, "Two-Phase produces near-optimal move length");

    PieceCube verifyDeep = deepCube;
    for (auto m : deepRes.solution) {
        verifyDeep = applyMove(verifyDeep, m);
    }
    assert_test(verifyDeep == solved, "Two-Phase 20-move solution reaches solved state");
}

int main() {
    std::cout << "Starting C++ Unit Test Runner...\n";
    testMoveEngine();
    testValidation();
    testSolvers();
    testTwoPhase();
    std::cout << "\n[ SUCCESS ] All C++ unit tests passed successfully!\n";
    return 0;
}
