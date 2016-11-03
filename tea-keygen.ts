import fs = require('fs');

const random = (min = 0, max = 0x100) =>
  Math.floor((Math.random() * (max - min)) + min);

const key: Buffer = Buffer.from(Array(8).fill(0).map(_ => random()));
fs.writeFileSync('tea-key', key);
console.log(`Generated key ${Array.from(key).map(x => x.toString(16)).join(' ')}.`);

const iv: Buffer = Buffer.from(Array(4).fill(0).map(_ => random()));
fs.writeFileSync('tea-iv', iv);
console.log(`Generated initialization vector ${Array.from(iv).map(x => x.toString(16)).join(' ')}.`);
