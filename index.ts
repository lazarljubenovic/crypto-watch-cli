// Core stuff
import fs = require('fs');
import yargs = require('yargs');
import chokidar = require('chokidar');
import mkdirp = require('mkdirp');
import path = require('path');

// Algorithms
import shiftByN = require('./algorithms/shift-by-n');
import simpleSubstitution = require('./algorithms/simple-substitution');
import codebookCypher = require('./algorithms/codebook-cypher');
import doubleTransposition = require('./algorithms/double-transposition');

// Constants
const watchDir = 'magic';
const outputDir = 'magic-output'

const argv = yargs
  .usage(`$0 <cmd> [command]`)
  .command('algo', 'Provide algorithm to use for encryption.' +
    'CapitalCamelCase, nonCapitalCamelCase or kebab-case')
  .command('options', 'Path to JSON file with configuration.')
  .help('h')
  .alias('h', 'help')
  .argv;

let optionsPath: string = argv['options'];
if (!optionsPath) {
  optionsPath = `${watchDir}/crypto.json`;
}
let options = JSON.parse(fs.readFileSync(optionsPath, 'utf8').toString());

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

  case 'codebookCypher':
  case 'dodebookCypher':
  case 'codebook-cypher':
  case 'codebook':
    algoFunc = codebookCypher;
    options = new Map(options['codebook-cypher']);
    break;

  case 'doubleTransposition':
  case 'DoubleTransposition':
  case 'double-transposition':
  case 'double':
    algoFunc = doubleTransposition;
    options = options['double-transposition'];
    break;

  case undefined:
    console.log(`--algo not specified. Using shift-by-n by default`);
    algoFunc = shiftByN;
    options = options['shift-by-n'];
    break;

  default:
    throw new Error(`Algorithm ${algo} is not supported (yet).`);
}

function encrypt(inputPath: string,
                 outputPath: string,
                 algoFunc: Function,
                 options: Object | number): void {
  fs.readFile(inputPath, (err, data) => {
    if (err) throw err;
    const plaintext = data.toString().trim();
    const cyphertext = algoFunc(plaintext, options);
    mkdirp(path.dirname(outputPath), err => {
      if (err) throw err;
      fs.writeFile(outputPath, cyphertext, err => {
        if (err) throw err;
        console.log(`Encryption successful!`);
        console.log(`\t${inputPath} => ${outputPath}`);
        console.log(`\t${plaintext} => ${cyphertext}`);
      });
    });
  });
}

function getOutputPath(inputPath: string): string {
  return inputPath.replace(watchDir, outputDir);
}

const eventHandler = (path) => {
  encrypt(path.toString(), getOutputPath(path.toString()), algoFunc, options);
}

let watcher: any;

function startWatching(path: string): void {
  watcher = chokidar.watch(path, {
    ignored: `**/crypto.json`
  });
  watcher
    .on('all', (event, path) => console.log(`${event}\t${path}`))
    .on('add', eventHandler)
    .on('change', eventHandler)
}

function stopWatching(path: string): void {
  watcher.close();
}

startWatching(watchDir);
