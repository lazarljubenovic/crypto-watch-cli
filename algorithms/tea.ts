import _ = require('lodash');

const pmod = (a, b) => (a % b + b) % b;

const numberOfRounds = 32;
const wordLengthInBits = 16;
const wordLengthInBytes = wordLengthInBits / 8;
const size = 2 ** wordLengthInBits;
const goldenRatio = 0x9e3779b9;

function rightPadBuffer(buffer: Buffer, multiplier: number = 1): Buffer {
  if (buffer.length % multiplier != 0) {
    const missingLength: number = multiplier - buffer.length % multiplier;
    const missingArray: number[] = Array(missingLength).fill(0x00);
    return Buffer.concat([buffer, Buffer.from(missingArray)]);
  } else {
    return buffer;
  }
}

function encryptBlock(value: Buffer, key: Buffer): Buffer {
  value = rightPadBuffer(value, wordLengthInBytes);
  let v: number[] = Array(2).fill(null).map((_, i) => i).map(i => 2 * i)
    .map(i => value.readUInt16BE(i));
  let k: number[] = Array(4).fill(null).map((_, i) => i).map(i => 2 * i)
    .map(i => key.readUInt16BE(i));
  let sum: number = 0;
  const delta: number = goldenRatio;

  for (let i = 0; i < numberOfRounds; i++) {
    sum = (sum + delta) % size;
    v[0] = pmod((v[0] +
      (pmod(((v[1] << 4) + k[0]), size) ^
      pmod((v[1] + sum), size) ^
      pmod(((v[1] >> 5) + k[1]), size))), size);
    v[1] = pmod((v[1] +
      (pmod(((v[0] << 4) + k[2]), size) ^
      pmod((v[0] + sum), size) ^
      pmod(((v[0] >> 5) + k[3]), size))), size);
  }
  let buffer = new Buffer(4);
  buffer.writeUInt16BE(v[0], 0);
  buffer.writeUInt16BE(v[1], 2);
  return buffer;
}

function decryptBlock(value: Buffer, key: Buffer): Buffer {
  value = rightPadBuffer(value, wordLengthInBits);
  let v: number[] = Array(2).fill(null).map((_, i) => i).map(i => 2 * i)
    .map(i => value.readUInt16BE(i));
  let k: number[] = Array(4).fill(null).map((_, i) => i).map(i => 2 * i)
    .map(i => key.readUInt16BE(i));
  const delta = goldenRatio;
  let sum = numberOfRounds * delta;
  for (let i = 0; i < numberOfRounds; i++) {
    v[1] = pmod((v[1] -
      (pmod(((v[0] << 4) + k[2]), size) ^
      pmod((v[0] + sum), size) ^
      pmod(((v[0] >> 5) + k[3]), size))), size);
    v[0] = pmod((v[0] -
      (pmod(((v[1] << 4) + k[0]), size) ^
      pmod((v[1] + sum), size) ^
      pmod(((v[1] >> 5) + k[1]), size))), size);
    sum = (sum - delta) % size;
  }
  v = v.map(n => (n >>> 0) % size);
  let buffer = new Buffer(4);
  buffer.writeUInt16BE(v[0], 0);
  buffer.writeUInt16BE(v[1], 2);
  return buffer;
}

function chunkBmp(bmp: Buffer): [Buffer, Buffer] {
  const startPosition: number = bmp.readInt32LE(0xA);
  const headers: Buffer = bmp.slice(0, startPosition);
  const imageData: Buffer = bmp.slice(startPosition);
  return [headers, imageData];
}

function _encryptDecrypt(encrypt: boolean,
                         buffer: Buffer,
                         key: Buffer,
                         bmp: boolean): Buffer {
  let result: Buffer = Buffer.alloc(0);
  if (bmp) {
    var chunks = chunkBmp(buffer);
    var bmpHeaders = chunks[0];
    buffer = chunks[1];
  }
  for (let i = 0; i < buffer.length; i += 4) {
    const block = buffer.slice(i, i + 4);
    const newResultBlock = encrypt ?
      encryptBlock(block, key) :
      decryptBlock(block, key);
    result = Buffer.concat([result, newResultBlock]);
  }
  if (bmp) {
    return Buffer.concat([bmpHeaders, result]);
  } else {
    return result;
  }
}

function encrypt(buffer: Buffer, key: Buffer, bmp: boolean = false): Buffer {
  return _encryptDecrypt(true, buffer, key, bmp);
}

function decrypt(buffer: Buffer, key: Buffer, bmp: boolean = false): Buffer {
  return _encryptDecrypt(false, buffer, key, bmp);
}

export = {
  rightPadBuffer,
  encrypt,
  decrypt,
  chunkBmp,
  encryptBlock,
  decryptBlock,
}
