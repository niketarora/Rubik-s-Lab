import { describe, it, expect } from 'vitest';
import {
  SOLVED_STATE,
  applyMove,
  applyScramble,
  isSolved,
  generateRandomScramble,
  validateScrambleNotation
} from '../utils/cube';

describe('Rubik\'s Cube Move Engine (JS visual sync)', () => {
  it('should initialize with a solved 54-sticker state', () => {
    expect(SOLVED_STATE).toHaveLength(54);
    expect(isSolved(SOLVED_STATE)).toBe(true);
    
    // Check face distribution
    const counts = SOLVED_STATE.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    expect(counts['U']).toBe(9);
    expect(counts['L']).toBe(9);
    expect(counts['F']).toBe(9);
    expect(counts['R']).toBe(9);
    expect(counts['B']).toBe(9);
    expect(counts['D']).toBe(9);
  });

  it('should validate standard scramble notation', () => {
    const valid = validateScrambleNotation("R U R' F2 U2 R'");
    expect(valid.valid).toBe(true);
    expect(valid.error).toBeNull();

    const invalid = validateScrambleNotation("R U R' F2 X");
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain('Invalid move token: "X"');
  });

  it('should apply standard moves and change state', () => {
    const stateAfterU = applyMove('U', SOLVED_STATE);
    expect(isSolved(stateAfterU)).toBe(false);

    // Apply U' (which is U prime / CCW) 3 times to get back to solved, or apply U' directly
    const backToSolved = applyMove("U'", stateAfterU);
    expect(isSolved(backToSolved)).toBe(true);
  });

  it('should apply double moves correctly', () => {
    const stateAfterR2 = applyMove('R2', SOLVED_STATE);
    const stateAfterR = applyMove('R', SOLVED_STATE);
    const stateAfterRDouble = applyMove('R', stateAfterR);

    expect(stateAfterR2).toEqual(stateAfterRDouble);
  });

  it('should parse and apply a complete scramble sequence', () => {
    const scrambled = applyScramble("R U R' F2");
    expect(isSolved(scrambled)).toBe(false);

    // Solve it by applying the inverse moves in reverse order: F2 R U' R'
    const solved = applyScramble("F2 R U' R'", scrambled);
    expect(isSolved(solved)).toBe(true);
  });

  it('should generate reproducible random scrambles of requested length', () => {
    const scramble = generateRandomScramble(15);
    const moves = scramble.split(/\s+/);
    expect(moves).toHaveLength(15);
    
    // Check that there are no consecutive moves on the same face
    for (let i = 0; i < moves.length - 1; i++) {
      const face1 = moves[i][0];
      const face2 = moves[i+1][0];
      expect(face1).not.toBe(face2);
    }
  });
});
