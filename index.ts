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
import electionCipher = require('./algorithms/election-cipher');

// Defaults
const defaults = {
  input: 'input',
  output: 'output',
  options: 'crypto.json',
  encryptFunc: electionCipher.encrypt,
  decryptFunc: electionCipher.decrypt,
}

function encrypt(inputPath: string,
                 outputPath: string,
                 encryptFunc: Function,
                 options: Object | number): void {
  fs.readFile(inputPath, (err, data) => {
    if (err) throw err;
    const plaintext = data.toString().trim();
    const cyphertext = encryptFunc(plaintext, options);
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
  return inputPath.replace(defaults.input, defaults.output);
}

const eventHandler = (path) => {
  encrypt(
    path.toString(),
    getOutputPath(path.toString()),
    defaults.encryptFunc,
    defaults.options
  );
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
    // TODO unlink
}

function stopWatching(path: string): void {
  watcher.close();
}

startWatching(defaults.input);
