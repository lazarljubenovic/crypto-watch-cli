import util = require('../util/util');
import _ = require('lodash');

function encrypt(plaintext: string,
                 permutation: number[],
                 prefixes?: Set<string>): string {
  return _.chunk(util.addRightPadding(
    util.splitCarefully(plaintext, prefixes),
    permutation.length
  ), permutation.length)
    .map(chunk => {
      return chunk.map((word, i) => chunk[permutation[i]]).join(' ');
    }).join(' ');
}

function decrypt(ciphertext: string,
                 permutation: number[],
                 prefixes?: Set<string>): string {
  return encrypt(ciphertext, inverseKey(permutation), prefixes);
}

function inverseKey(key: number[]): number[] {
  return key.map((_, i) => key.indexOf(i));
}

export = {
  encrypt,
  decrypt,
  inverseKey,
};
