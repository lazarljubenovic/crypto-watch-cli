// Utils
import mod = require('../util/positive-mod');

const aCode = "a".charCodeAt(0);
const abcLength = 26;

function shiftByN(plaintext: string, offset: number = 3): string {
  return plaintext
    .split('')
    .map(letter => String.fromCharCode(mod((letter.charCodeAt(0) - aCode + offset), abcLength) + aCode))
    .join('');
}

export = shiftByN;
