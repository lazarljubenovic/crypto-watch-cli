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

function permutate(arr: any[], permutation: number[]): any[] {
  const identityPermutation: number[] =
    Array(permutation.length).fill(null).map((_, i) => i);
  const isValid: boolean = permutation.concat().sort()
    .every((el, i) => el === identityPermutation[i]);
  const isTooLarge: boolean = permutation.length > arr.length;
  if (!isValid) {
    throw new Error(`Invalid permutation {${permutation.join(',')}}.`);
  }
  if (isTooLarge) {
    throw new Error(`Permutation {${permutation.join(',')}}` +
      `for array of length ${arr.length}.`);
  }
  return arr.map((_, i) => arr[permutation[i]]);
}

function splitCarefully(text: string,
                        prefixes?: Set<string>): string[] {
  if (prefixes == null) {
    return text.split(' ');
  }
  const regexp = `((?:${[...prefixes].join('|')})\\s\\w+,?\\.?;?\\??\\!?)|\\s`;
  return text.split(new RegExp(regexp, `gi`)).filter(el => !!el);
}

function addRightPadding(arr: any[], multiplier: number): any[] {
  if (arr.length % multiplier == 0) {
    return arr;
  } else {
    const missingCount = multiplier - arr.length % multiplier;
    return arr.concat(arr.slice(0, missingCount));
  }
}

export = {
  positiveMod,
  stripWhitespace,
  permutateRows,
  permutateColumns,
  rightPad,
  stringToMatrix,
  matrixToString,
  permutate,
  splitCarefully,
  addRightPadding,
};
