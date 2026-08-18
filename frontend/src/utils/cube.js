// Standard 2D Cube Net representation and moves logic.
// Faces: U (0-8, Yellow), L (9-17, Orange), F (18-26, Green), R (27-35, Red), B (36-44, Blue), D (45-53, White)

export const SOLVED_STATE = Array(54).fill(null).map((_, i) => {
  if (i < 9) return 'U'; // Yellow
  if (i < 18) return 'L'; // Orange
  if (i < 27) return 'F'; // Green
  if (i < 36) return 'R'; // Red
  if (i < 45) return 'B'; // Blue
  return 'D'; // White
});

// Helper to rotate a single face's 9 stickers Clockwise
const rotateFaceCW = (faceIdx, state) => {
  const offset = faceIdx * 9;
  const old = state.slice(offset, offset + 9);
  const cw = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  for (let i = 0; i < 9; i++) {
    state[offset + i] = old[cw[i]];
  }
};

// Apply one clockwise move to the 54-sticker state
export const applyMove = (move, state) => {
  const next = [...state];
  const baseMove = move.replace("'", "").replace("2", "");
  const isPrime = move.includes("'");
  const isDouble = move.includes("2");

  const iterations = isDouble ? 2 : (isPrime ? 3 : 1);

  for (let iter = 0; iter < iterations; iter++) {
    const prev = [...next];

    switch (baseMove) {
      case 'U':
        rotateFaceCW(0, next);
        next[18] = prev[27]; next[19] = prev[28]; next[20] = prev[29]; // F <- R
        next[27] = prev[36]; next[28] = prev[37]; next[29] = prev[38]; // R <- B
        next[36] = prev[9];  next[37] = prev[10]; next[38] = prev[11]; // B <- L
        next[9] = prev[18];  next[10] = prev[19]; next[11] = prev[20]; // L <- F
        break;

      case 'D':
        rotateFaceCW(5, next);
        next[24] = prev[15]; next[25] = prev[16]; next[26] = prev[17]; // F <- L
        next[15] = prev[42]; next[16] = prev[43]; next[17] = prev[44]; // L <- B
        next[42] = prev[33]; next[43] = prev[34]; next[44] = prev[35]; // B <- R
        next[33] = prev[24]; next[34] = prev[25]; next[35] = prev[26]; // R <- F
        break;

      case 'F':
        rotateFaceCW(2, next);
        next[27] = prev[6];  next[30] = prev[7];  next[33] = prev[8];  // R <- U
        next[47] = prev[27]; next[46] = prev[30]; next[45] = prev[33]; // D <- R
        next[17] = prev[47]; next[14] = prev[46]; next[11] = prev[45]; // L <- D
        next[6] = prev[17];  next[7] = prev[14];  next[8] = prev[11];  // U <- L
        break;

      case 'B':
        rotateFaceCW(4, next);
        next[9] = prev[2];   next[12] = prev[1];   next[15] = prev[0];   // L <- U
        next[51] = prev[9];  next[52] = prev[12];  next[53] = prev[15];  // D <- L
        next[35] = prev[51]; next[32] = prev[52];  next[29] = prev[53];  // R <- D
        next[0] = prev[29];  next[1] = prev[32];   next[2] = prev[35];   // U <- R
        break;

      case 'L':
        rotateFaceCW(1, next);
        next[18] = prev[0];  next[21] = prev[3];  next[24] = prev[6];  // F <- U
        next[45] = prev[18]; next[48] = prev[21]; next[51] = prev[24]; // D <- F
        next[44] = prev[45]; next[41] = prev[48]; next[38] = prev[51]; // B <- D
        next[6] = prev[38];  next[3] = prev[41];  next[0] = prev[44];  // U <- B
        break;

      case 'R':
        rotateFaceCW(3, next);
        next[36] = prev[8];  next[39] = prev[5];  next[42] = prev[2];  // B <- U
        next[53] = prev[36]; next[50] = prev[39]; next[47] = prev[42]; // D <- B
        next[26] = prev[53]; next[23] = prev[50]; next[20] = prev[47]; // F <- D
        next[8] = prev[26];  next[5] = prev[23];  next[2] = prev[20];  // U <- F
        break;

      default:
        break;
    }
  }

  return next;
};

// Apply a full scramble sequence (e.g. "R U R' F2")
export const applyScramble = (scrambleStr, state = SOLVED_STATE) => {
  if (!scrambleStr || scrambleStr.trim() === "") return state;
  const moves = scrambleStr.trim().split(/\s+/);
  let current = [...state];
  for (const m of moves) {
    if (m) current = applyMove(m, current);
  }
  return current;
};

// Check if a state is solved
export const isSolved = (state) => {
  return state.every((color, idx) => color === SOLVED_STATE[idx]);
};

// Generate a random scramble of given length
export const generateRandomScramble = (length = 20) => {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  let scramble = [];
  let lastFace = '';

  for (let i = 0; i < length; i++) {
    let face = faces[Math.floor(Math.random() * faces.length)];
    while (face === lastFace) {
      face = faces[Math.floor(Math.random() * faces.length)];
    }
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(`${face}${modifier}`);
    lastFace = face;
  }

  return scramble.join(' ');
};

// Validate standard cube notation
export const validateScrambleNotation = (scrambleStr) => {
  if (!scrambleStr || scrambleStr.trim() === '') return { valid: true, error: null };
  const tokens = scrambleStr.trim().split(/\s+/);
  const validRegex = /^[UDLRFB]['2]?$/;

  for (const token of tokens) {
    if (!validRegex.test(token)) {
      return {
        valid: false,
        error: `Invalid move token: "${token}". Supported tokens: U U' U2 D D' D2 L L' L2 R R' R2 F F' F2 B B' B2`
      };
    }
  }
  return { valid: true, error: null };
};
