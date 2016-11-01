import _ = require('lodash');

/** Splits binary string to chunks and adds padding */
function _splitKey(key: string, numberOfBits: number): string[] {
  let splitKey: string[] = _.chunk(key.split(''), numberOfBits)
    .map(chunk => chunk.join(''));
  splitKey[splitKey.length - 1] =
    _.padEnd(splitKey[splitKey.length - 1], numberOfBits, '0');
  return splitKey;
}

function generateKey(numberOfBits: number, keyString: string): number[] {
  const n = numberOfBits;
  const key: string[] = _splitKey(keyString, n);
  let S: number[] = Array(2 ** n).fill(null).map((_, i) => i);
  let j = 0;
  for (let i = 0; i <= 2 ** n - 1; i++) {
    j = (j + S[i] + Number.parseInt(key[i % key.length], 2)) % (2 ** n);
    [S[i], S[j]] = [S[j], S[i]];
  }
  return S;
}

function splitBuffer(buffer: Buffer, chunkSize: number): number[] {
  const arrayOfOnesAndZeroes: string[] = buffer
    .toString('hex')
    .split('')
    .map(hex => Number.parseInt(`0x${hex}`).toString(2))
    .map(binaryString => _.padStart(binaryString, 4, '0'))
    .map(binaryString => binaryString.split(''))
    .reduce((acc, curr) => acc.concat(curr))
  let chunkedBinaryArray: string[][] = _.chunk(arrayOfOnesAndZeroes, chunkSize);
  chunkedBinaryArray[chunkedBinaryArray.length - 1] =
    _.padEnd(
      chunkedBinaryArray[chunkedBinaryArray.length - 1].join(''),
      chunkSize,
      '0'
    ).split('');
  return chunkedBinaryArray
    .map(chunk => chunk.join(''))
    .map(chunk => Number.parseInt(chunk, 2));
}

function getAddend(plaintext: Buffer, S: number[]) {
  const plain: number[] = splitBuffer(plaintext, Math.log2(S.length));
  let j = 0;
  const addend = plain.map((chunk, i) => {
    i = (i + 1) % S.length;
    j = (j + S[i]) % S.length;
    [S[i], S[j]] = [S[j], S[i]];
    return S[(S[i] + S[j]) % S.length];
  });
  return addend;
}

function encrypt(plaintext: Buffer, n: number, keyBinaryString: string) {
  console.log(`Generating key...`);
  const S = generateKey(n, keyBinaryString);
  console.log(`Key generated: `, S);
  console.log(`Spliting buffer...`);
  const xor1 = splitBuffer(plaintext, n);
  console.log(`Buffer split: `, xor1);
  console.log(`Generating addend...`);
  const xor2 = getAddend(plaintext, S);
  console.log(`Addend generated: `, xor2);
  console.log(`XOR'ing...`);
  const result = xor1.map((n, i) => n ^ xor2[i]);
  console.log(`XOR'ed: `, result);
  return result;
}

function getBuffer(arr: number[], n: number = 4) {
  let hexArray = [];
  for (let i = 0; i < arr.length; i += 2) {
    hexArray = hexArray.concat(arr[i] * 0x10 + arr[i + 1]);
  }
  return Buffer.from(hexArray);
}

export = {
  generateKey,
  splitBuffer,
  getAddend,
  encrypt,
  getBuffer,
};
