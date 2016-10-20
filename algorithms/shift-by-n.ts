import util = require('../util/util');

const aCode = "a".charCodeAt(0);
const abcLength = 26;

function shiftByN(plaintext: string, offset: number = 3): string {
  return util.stripWhitespace(plaintext)
    .split('')
    .map(letter =>
      String.fromCharCode(
        util.positiveMod((letter.charCodeAt(0) - aCode + offset), abcLength) + aCode))
    .join('');
}

export = shiftByN;
