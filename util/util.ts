import _ = require('lodash');

function positiveMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function stripWhitespace(s: string): string {
  return s.replace(/\s+/g, '');
}

function permutateRows(matrix: string[][],
                       permutation: number[]): string[][] {
  return Array(matrix.length).fill(null)
    .map((_, i) => matrix[permutation[i]].concat());
}

function permutateColumns(matrix: string[][],
                          permutation: number[]): string[][] {
  return Array(matrix.length).fill(null)
    .map((_, i) => matrix[i].map((_, j) => matrix[i][permutation[j]]));
}

function rightPad(s: string, len: number, pad: string): string {
  let ret = s;
  while (ret.length < len) ret += pad;
  return ret.slice(0, len);
}

function stringToMatrix(s: string, col: number): string[][] {
  let matrix = _.chunk(s, col);
  // fix last row of not enough characters
  let lastRow = matrix[matrix.length - 1];
  if (lastRow.length !== col) {
    matrix[matrix.length - 1] = rightPad(lastRow.join(''), col, s).split('');
  }
  return matrix;
}

function matrixToString(matrix: string[][]): string {
  return matrix.map(row => row.join('')).join('');
}

export = {
  positiveMod,
  stripWhitespace,
  permutateRows,
  permutateColumns,
  rightPad,
  stringToMatrix,
  matrixToString,
};
