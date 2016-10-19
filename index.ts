// Core stuff
import fs = require('fs');
import yargs = require('yargs');

// Algorithms
import shiftByN = require('./algorithms/shift-by-n');
import simpleSubstitution = require('./algorithms/simple-substitution');

// Constants
const INPUT = './magic/attackatdawn.txt';
const OUTPUT = (name: string = 'default') =>
  `./magic-output/attackatdawn-${name}.txt`;

const argv = yargs
  .usage(`$0 <cmd> [command]`)
  .command('algo', 'Provide algorithm to use for encryption. CapitalCamelCase, nonCapitalCamelCase or kebab-case')
  .command('options', 'Path to JSON file with configuration.')
  .help('h')
  .alias('h', 'help')
  .argv;

let optionsPath: string = argv['options'];
if (!optionsPath) {
  optionsPath = './magic/crypto.json';
}
let options = JSON.parse(fs.readFileSync(optionsPath), 'utf8');

const algo: string = argv['algo'];
let algoFunc: Function;

switch(algo) {
  case 'shiftByN':
  case 'ShiftByN':
  case 'shift-by-n':
  case 'shift':
    algoFunc = shiftByN;
    options = options['shift-by-n'];
    break;

  case 'simpleSubstitution':
  case 'simpleSubstitution':
  case 'simple-substitution':
    algoFunc = simpleSubstitution;
    options = new Map(options['simple-substitution']);
    break;

  case true:
    console.log(`--algo not specified. Using shift-by-n by default`);
    algoFunc = shiftByN;
    options = options['shift-by-n'];
    break;

  default:
    throw new Error(`Algorithm ${algo} is not supported (yet).`);
}

fs.readFile(INPUT, (err, data) => {
  if (err) throw err;
  const plaintext = data.toString().trim();
  const cyphertext = algoFunc(plaintext, options);
  fs.writeFile(OUTPUT(algo), cyphertext, err => {
    if (err) throw err;
    console.log(`Encryption successful!`);
    console.log(`${plaintext} => ${cyphertext}`);
  });
});
