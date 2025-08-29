// Verhoeff algorithm tables and helpers

const d = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];

const p = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,9,3,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8]
];

const inv = [0,4,3,2,1,5,6,7,8,9];

/**
 * validateVerhoeff(numberString)
 * Returns true if numberString (string of digits) is valid under Verhoeff (i.e., checksum is correct)
 */
export function validateVerhoeff(numStr) {
  if (typeof numStr !== 'string') return false;
  if (!/^[0-9]+$/.test(numStr)) return false;
  let c = 0;
  const digits = numStr.split('').reverse().map(ch => parseInt(ch, 10));
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * generateVerhoeffDigit(numberStringWithoutChecksum)
 * Returns single checksum digit (0-9) to append to make the string verhoeff-valid
 */
export function generateVerhoeffDigit(numStr) {
  if (typeof numStr !== 'string') throw new Error('Input must be string');
  if (!/^[0-9]+$/.test(numStr)) throw new Error('Input contains non-digits');
  let c = 0;
  const digits = numStr.split('').reverse().map(ch => parseInt(ch, 10));
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i + 1) % 8][digits[i]]]; // note: when generating checksum, pos permutation shifts by 1
  }
  return inv[c];
}
