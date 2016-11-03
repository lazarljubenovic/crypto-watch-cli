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

function BufferXOR(a: Buffer, b: Buffer): Buffer {
  return Buffer.from([a, b].map(x => Array.from(x))
    .reduce((a, b) => b.map((el, i) => el ^ a[i]), []));
}

const print = (b: Buffer) =>
  Array.from(b)
    .map(x => x.toString(16))
    .map(x => _.padStart(x, 2, '0'))
    .join(' ');

function _encryptDecrypt(encrypt: boolean,
                         buffer: Buffer,
                         key: Buffer,
                         iv: Buffer,
                         mode: string,
                         bmp: boolean): Buffer {
  const log = false;
  let result: Buffer = Buffer.alloc(0);
  if (bmp) {
    var chunks = chunkBmp(buffer);
    var bmpHeaders = chunks[0];
    buffer = chunks[1];
  }
  let prevIv: Buffer = iv;
  for (let i = 0; i < buffer.length; i += 4) {
    const block = buffer.slice(i, i + 4);
    log && console.log();
    log && console.log(`Chunk ${i}`)
    log && console.log(`Block  = ${print(block)}`);
    log && console.log(`IV     = ${prevIv && print(prevIv)}`);
    let encryptionParam1: Buffer;
    let encryptionParam2: Buffer;
    switch (mode) {
    case 'ecb':
      encryptionParam1 = block;
      encryptionParam2 = key;
      break;
    case 'cfb':
      encryptionParam1 = prevIv;
      encryptionParam2 = key;
      break;
    }
    const newResultBlock = encrypt || mode == 'cfb' ?
      encryptBlock(encryptionParam1, encryptionParam2) :
      decryptBlock(encryptionParam1, encryptionParam2);
    log && console.log(`Result = ${print(newResultBlock)}`);
    switch (mode) {
      case 'ecb':
        result = Buffer.concat([result, newResultBlock]);
        break;
      case 'cfb':
        const xor = BufferXOR(newResultBlock, block);
        log && console.log(`XOR    = ${print(xor)}`);
        if (encrypt) {
          prevIv = xor;
        } else {
          prevIv = block;
        }
        result = Buffer.concat([result, xor]);
        break;
    }
    log && console.log(`Full   = ${print(result)}`);
    log && console.log(`-------`);
  } // for loop end
  if (bmp) {
    return Buffer.concat([bmpHeaders, result]);
  } else {
    return result;
  }
}

function encrypt(buffer: Buffer,
                 key: Buffer,
                 iv: Buffer,
                 mode: string = 'ecb',
                 bmp: boolean = false): Buffer {
  return _encryptDecrypt(true, buffer, key, iv, mode, bmp);
}

function decrypt(buffer: Buffer,
                 key: Buffer,
                 iv: Buffer,
                 mode: string = 'ecb',
                 bmp: boolean = false): Buffer {
  return _encryptDecrypt(false, buffer, key, iv, mode, bmp);
}

export = {
  rightPadBuffer,
  encrypt,
  decrypt,
  chunkBmp,
  encryptBlock,
  decryptBlock,
  BufferXOR,
}
