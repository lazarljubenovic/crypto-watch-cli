// Core stuff
import fs = require('fs');
import yargs = require('yargs');
import chokidar = require('chokidar');
import mkdirp = require('mkdirp');
import path = require('path');
import WebSocket = require('ws');
import Rx = require('rxjs/Rx');

// Algorithms
import util = require('./util/util');
import shiftByN = require('./algorithms/shift-by-n');
import simpleSubstitution = require('./algorithms/simple-substitution');
import codebookCypher = require('./algorithms/codebook-cypher');
import doubleTransposition = require('./algorithms/double-transposition');
import electionCipher = require('./algorithms/election-cipher');

interface Options {
  input: string;
  output: string;
  optionsPath: string;
  encryptFunc: Function;
  decryptFunc: Function;
  permutation: number[];
  prefixes: string[];
}

// Defaults (program-wise)
const defaults = {
  input: 'input',
  output: 'output',
  optionsPath: 'crypto.json',
  encryptFunc: electionCipher.encrypt,
  decryptFunc: electionCipher.decrypt,
}

// Algorithm defaults
const electionDefaults = {
  permutation: [1, 0],
  prefixes: ['san', 'los', 'las', 'de', 'saint', 'st'],
};

console.log(`Checking for crypto.json file...`);
let options: Options;
try {
  options =
    JSON.parse(fs.readFileSync(defaults.optionsPath, {
      encoding: 'utf8'}
    ))['election-1876-cipher'];
  console.log(`crypto.json file found, using its settings.`);
  options = Object.assign({}, options, defaults);
} catch (e) {
  console.error(`File ${defaults.optionsPath} not found, using defaults.`);
  options = Object.assign({}, defaults, electionDefaults);
}

console.log(`Settings loaded.`);
console.log(options);

function encrypt(filename: string): void {
  fs.readFile(filename, (err, data) => {
    if (err) throw err;
    const plaintext = data.toString().trim();
    const cyphertext = options.encryptFunc(
      plaintext,
      options.permutation,
      new Set(options.prefixes)
    );
    const outputPath = filename.replace(new RegExp(`^{options.input}`), options.output);
    mkdirp(path.dirname(options.output), err => {
      if (err) throw err;
      fs.writeFile(outputPath, cyphertext, err => {
        if (err) throw err;
        console.log(`Encryption successful!`);
        console.log(`\t${filename} => ${outputPath}`);
        console.log(`\t${plaintext} => ${cyphertext}`);
      });
    });
  });
}

function getOutputPath(inputPath: string): string {
  return inputPath.replace(defaults.input, defaults.output);
}

const eventHandler = (path) => {
  encrypt(path.toString());
}

let watcher: any;

function startWatching(): void {
  watcher = chokidar.watch(options.input, {
    ignored: `**/crypto.json`
  });
  watcher
    .on('all', (event, path) => console.log(`${event}\t${path}`))
    .on('add', eventHandler)
    .on('change', eventHandler)
    // TODO unlink
}

function stopWatching(): void {
  try {
    watcher.close();
  } catch (e) {
    // Don't care
  }
}

// Receive data from GUI and change settings according to it

function fsExists(path: string,
                  ifYes: () => any,
                  ifNo: (err: any) => any): void {
  fs.lstat(path, (err, stats) => {
    if (err || !stats.isDirectory) {
      ifNo(err || `${path} is not a directory.`);
    } else {
      ifYes();
    }
  });
}

const wss = new WebSocket.Server({ port: 4201 });
const connectionMessageSubject = new Rx.Subject();

wss.on('connection', ws => {
  console.log(`connection on`);

  ws.on('message', message => {
    //console.log(`Primljena poruka: ${message}`);
    try {
      message = JSON.parse(message)
    } catch (e) {
      console.error(`Could not parse ${message} as JSON.`)
      throw e;
    }
    connectionMessageSubject.next(message);
  });

  ws.send(JSON.stringify('server zove klijenta'));
});

const optionWatchFiles$ = connectionMessageSubject
  .map(options => options['watch'])
  .distinctUntilChanged()
  .subscribe(watch => {
    if (watch) {
      console.log(`Start watching...`);
      startWatching();
    } else {
      console.log(`Stop watching...`);
      stopWatching();
    }
  });
