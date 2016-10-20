import util = require('../util/util');

interface DoubleTranspositionOptions {
  col: number;
  columnFirst: boolean;
  per1: number[];
  per2: number[];
}

function doubleTransposition(plaintext: string,
                             options: DoubleTranspositionOptions): string {
  const [func1, func2] = options.columnFirst
    ? [util.permutateColumns, util.permutateRows]
    : [util.permutateRows, util.permutateColumns];
  return util.matrixToString(
    func2(
      func1(util.stringToMatrix(plaintext, options.col), options.per1),
      options.per2
    )
  )
}

export = doubleTransposition;
