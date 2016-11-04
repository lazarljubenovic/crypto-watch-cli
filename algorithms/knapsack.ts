import _ = require('lodash');
import tea = require('./tea');

function isSuperincreasing(arr: number[]): boolean {
  if (arr.length == 0) {
    return false;
  }
  let sum: number = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= sum) {
      return false;
    } else {
      sum += arr[i];
    }
  }
  return true;
}

function getPublicKey(P: number[], M: number, N: number): number[] {
  if (!isSuperincreasing(P)) {
    throw new Error(`P has to be superincreasing.`);
  }
  if (!isSuperincreasing(P.concat(N))) {
    throw new Error(`N (${N}) has to be larger than sum ` +
      `of P (${P.reduce((a, b) => a + b, 0)}).`)
  }
  return P.map(p => (p * M) % N);
}

type KnapsackPrivateKey = {P: number[], IM: number, N: number};

function getPrivateKey(P: number[],
                       M: number,
                       N: number): KnapsackPrivateKey {
  for (let q = 0; q < M; q++) {
    let im = (q * N + 1) / M;
    if (im == Math.floor(im)) {
      return {P, N, IM: im};
    }
  }
  throw new Error(`Impossible!`);
}

function encryptBlock(plaintext: number, P: number[], M, N): number {
  const J = getPublicKey(P, M, N);
  let binary = plaintext.toString(2);
  if (J.length < binary.length) {
    throw new Error(`Too big data! ${J.length} < ${binary.length}`);
  }
  binary = _.padStart(binary, J.length, '0');
  return J.reduce((acc, curr, i) => acc + curr * Number(binary[i]), 0);
}

function decryptBlock(ciphertext: number,
                      P: number[],
                      IM: number,
                      N: number): number {
  const binary = ciphertext.toString(2);
  let solution: string = '';
  let TC = ciphertext * IM % N;
  for (let i = P.length - 1; i >= 0; i--) {
    if (TC < P[i]) {
      solution += '0';
    } else {
      solution += '1';
      TC -= P[i];
    }
  }
  if (TC != 0) {
    throw new Error(`TC was leftover (${TC}). Impossible to decrypt.`);
  } else {
    return Number.parseInt(solution.split('').reverse().join(''), 2);
  }
}

function rightPadBuffer(buffer: Buffer, multiplier: number = 1): Buffer {
  return tea.rightPadBuffer(buffer, multiplier);
}

function encrypt(buffer: Buffer,
                 bytes: number,
                 P: number[],
                 M: number,
                 N: number): number[] {
  buffer = rightPadBuffer(buffer, bytes);
  let ciphertext: number[] = [];
  for (let i = 0; i < buffer.length; i += bytes) {
    const plainBlock: number = buffer.readUIntBE(i, bytes);
    const cipherBlock = encryptBlock(plainBlock, P, M, N);
    ciphertext = ciphertext.concat(cipherBlock);
  }
  return ciphertext;
}

function decrypt(cipher: number[],
                 P: number[],
                 im: number,
                 N: number): Buffer {
  return Buffer.from(cipher.map(block => decryptBlock(block, P, im, N)));
}

export = {
  isSuperincreasing,
  getPublicKey,
  getPrivateKey,
  encryptBlock,
  decryptBlock,
  encrypt,
  decrypt,
}
