type BlockSpec = { count: number; data: number; ecc: number };

// Version 11, low error correction is enough for the long, exact vCard payload.
const VERSION = 11;
const SIZE = 17 + VERSION * 4;
const BLOCKS: BlockSpec = { count: 4, data: 81, ecc: 20 };
const ALIGNMENT = [6, 30, 54];

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let value = 1;
for (let i = 0; i < 255; i += 1) {
  EXP[i] = value;
  LOG[value] = i;
  value <<= 1;
  if (value & 0x100) value ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];

function multiply(a: number, b: number) {
  return a && b ? EXP[LOG[a] + LOG[b]] : 0;
}

function generator(degree: number) {
  const result = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(result.length + 1).fill(0);
    for (let j = 0; j < result.length; j += 1) {
      next[j] ^= result[j];
      next[j + 1] ^= multiply(result[j], EXP[i]);
    }
    result.splice(0, result.length, ...next);
  }
  return result;
}

function errorCorrection(data: number[], degree: number) {
  const gen = generator(degree);
  const result = new Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < degree; i += 1) result[i] ^= multiply(gen[i + 1], factor);
  });
  return result;
}

function bitsToBytes(bits: number[]) {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | (bits[i + j] || 0);
    out.push(byte);
  }
  return out;
}

function formatBits(mask: number) {
  // Level L is 01. BCH remainder polynomial 0x537 and mask 0x5412.
  let bits = ((0b01 << 3) | mask) << 10;
  let valueBits = bits;
  while (valueBits >>> 10) {
    const shift = Math.floor(Math.log2(valueBits)) - 10;
    valueBits ^= 0x537 << shift;
  }
  return ((((0b01 << 3) | mask) << 10) | valueBits) ^ 0x5412;
}

function createData(payload: string) {
  const bytes = Array.from(new TextEncoder().encode(payload));
  const bits: number[] = [];
  const add = (number: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((number >>> i) & 1);
  };
  add(0b0100, 4);
  add(bytes.length, 16);
  bytes.forEach((byte) => add(byte, 8));
  for (let i = 0; i < Math.min(4, BLOCKS.data * BLOCKS.count * 8 - bits.length); i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = bitsToBytes(bits);
  let pad = 0;
  while (data.length < BLOCKS.data * BLOCKS.count) {
    data.push(pad % 2 === 0 ? 0xec : 0x11);
    pad += 1;
  }
  const dataBlocks: number[][] = [];
  const eccBlocks: number[][] = [];
  for (let i = 0; i < BLOCKS.count; i += 1) {
    const block = data.slice(i * BLOCKS.data, (i + 1) * BLOCKS.data);
    dataBlocks.push(block);
    eccBlocks.push(errorCorrection(block, BLOCKS.ecc));
  }
  const result: number[] = [];
  for (let i = 0; i < BLOCKS.data; i += 1) dataBlocks.forEach((block) => result.push(block[i]));
  for (let i = 0; i < BLOCKS.ecc; i += 1) eccBlocks.forEach((block) => result.push(block[i]));
  return result;
}

function emptyMatrix(): (boolean | null)[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function setFinder(matrix: (boolean | null)[][], row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const dark = inside && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      if (row + r >= 0 && row + r < SIZE && col + c >= 0 && col + c < SIZE) matrix[row + r][col + c] = dark;
    }
  }
}

function functionMatrix() {
  const matrix = emptyMatrix();
  setFinder(matrix, 0, 0);
  setFinder(matrix, 0, SIZE - 7);
  setFinder(matrix, SIZE - 7, 0);
  ALIGNMENT.forEach((row) => ALIGNMENT.forEach((col) => {
    if (matrix[row][col] !== null) return;
    for (let r = -2; r <= 2; r += 1) for (let c = -2; c <= 2; c += 1) matrix[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
  }));
  for (let i = 8; i < SIZE - 8; i += 1) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }
  matrix[SIZE - 8][8] = true;
  return matrix;
}

function applyFormat(matrix: (boolean | null)[][], mask: number) {
  const bits = formatBits(mask);
  // The two mirrored format strings use the same 15 bits, MSB first.
  for (let i = 0; i < 15; i += 1) {
    const bit = ((bits >>> i) & 1) === 1;
    if (i < 6) matrix[i][8] = bit;
    else if (i < 8) matrix[i + 1][8] = bit;
    else matrix[SIZE - 15 + i][8] = bit;
    if (i < 8) matrix[8][SIZE - i - 1] = bit;
    else if (i < 9) matrix[8][15 - i] = bit;
    else matrix[8][15 - i - 1] = bit;
  }
  matrix[SIZE - 8][8] = true;
}

function maskApplies(mask: number, row: number, col: number) {
  if (mask === 0) return (row + col) % 2 === 0;
  if (mask === 1) return row % 2 === 0;
  if (mask === 2) return col % 3 === 0;
  if (mask === 3) return (row + col) % 3 === 0;
  if (mask === 4) return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
  if (mask === 5) return (row * col) % 2 + (row * col) % 3 === 0;
  if (mask === 6) return ((row * col) % 2 + (row * col) % 3) % 2 === 0;
  return ((row * col) % 3 + (row + col) % 2) % 2 === 0;
}

function drawData(matrix: (boolean | null)[][], codewords: number[], mask: number) {
  let bitIndex = 0;
  let upward = true;
  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let offset = 0; offset < SIZE; offset += 1) {
      const row = upward ? SIZE - 1 - offset : offset;
      for (let c = 0; c < 2; c += 1) {
        const currentCol = col - c;
        if (matrix[row][currentCol] !== null) continue;
        const bit = bitIndex < codewords.length * 8
          ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - (bitIndex % 8))) & 1) === 1
          : false;
        matrix[row][currentCol] = bit !== maskApplies(mask, row, currentCol);
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

function penalty(matrix: (boolean | null)[][]) {
  let score = 0;
  const get = (r: number, c: number) => matrix[r][c] === true;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (c + 4 < SIZE && get(r, c) === get(r, c + 1) && get(r, c) === get(r, c + 2) && get(r, c) === get(r, c + 3) && get(r, c) === get(r, c + 4)) score += 3;
      if (r + 4 < SIZE && get(r, c) === get(r + 1, c) && get(r, c) === get(r + 2, c) && get(r, c) === get(r + 3, c) && get(r, c) === get(r + 4, c)) score += 3;
    }
  }
  for (let r = 0; r < SIZE - 1; r += 1) for (let c = 0; c < SIZE - 1; c += 1) {
    if (get(r, c) === get(r + 1, c) && get(r, c) === get(r, c + 1) && get(r, c) === get(r + 1, c + 1)) score += 3;
  }
  let dark = 0;
  matrix.forEach((row) => row.forEach((cell) => { if (cell) dark += 1; }));
  score += Math.floor(Math.abs((dark * 100) / (SIZE * SIZE) - 50) / 5) * 10;
  return score;
}

export function encodeQr(payload: string) {
  const data = createData(payload);
  let best: boolean[][] | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = functionMatrix();
    applyFormat(matrix, mask);
    drawData(matrix, data, mask);
    const score = penalty(matrix);
    if (score < bestScore) {
      bestScore = score;
      best = matrix.map((row) => row.map((cell) => cell === true));
    }
  }
  return best!;
}