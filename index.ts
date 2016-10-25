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
  func: Function;
  permutationFromGui: number[];
  permutation: number[],
  isOptionsFromFile: boolean;
  prefixes: string[];
}

interface GuiSettings {
  watch: boolean;
  sourcePath: string;
  destinationPath: string;
  isEncryption: boolean;
  isOptionsFromFile: boolean;
  permutationFromGui: number[];
}

// Defaults (program-wise)
const defaults = {
  input: 'input',
  output: 'output',
  optionsPath: 'crypto.json',
  func: electionCipher.encrypt,
  permutationFromGui: [1, 0],
  isOptionsFromFile: true,
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
    const cyphertext = options.func(
      plaintext,
      options.isOptionsFromFile
        ? options.permutation
        : options.permutationFromGui,
      new Set(options.prefixes)
    );
    const outputPath = getCorrespondingOutputFilePath(filename);
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

function getCorrespondingOutputFilePath(inputFilePath: string): string {
  const regexp = new RegExp(`^${options.input}`);
  const outputPath = inputFilePath.replace(regexp, options.output);
  return outputPath;
}

function deleteEncrypted(pathToFile: string): string {
  const pathToOutputFile = getCorrespondingOutputFilePath(pathToFile);
  fs.unlink(pathToOutputFile, err => {
    if (err) throw err;
    console.log(`${pathToFile} deleted => ${pathToOutputFile} deleted`);
  })
}

let watcher: any;

function startWatching(): void {
  watcher = chokidar.watch(`${options.input}/**/*.txt`, {
    ignored: `**/crypto.json`
  });
  watcher
    .on('all', (event, path) => console.log(`${event}\t${path}`))
    .on('add', pathToFile => encrypt(pathToFile))
    .on('change', pathToFile => encrypt(pathToFile))
    .on('unlink', pathToFile => deleteEncrypted(pathToFile));
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
let ws: WebSocket;
const connectionMessageSubject: Rx.Subject<GuiSettings> = new Rx.Subject();
const convertSubject: Rx.Subject<boolean> = new Rx.Subject();

wss.on('connection', _ws => {
  ws = _ws; // set global variable to use for closures
  _ws.on('message', message => {
    console.log(`Primljena poruka: ${message}`);
    try {
      message = JSON.parse(message)
    } catch (e) {
      console.error(`Could not parse ${message} as JSON.`)
      throw e;
    }
    if (typeof message == 'string' && message.toLowerCase() == "convert") {
      convertSubject.next(true);
    } else {
      connectionMessageSubject.next(message)
    }
  });
});

convertSubject.subscribe(() => {
  // TODO convert all
});

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.watch)
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

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.sourcePath)
  .distinctUntilChanged()
  .subscribe(sourcePath => {
    fsExists(
      sourcePath,
      () => {
        console.log(`Setting source path to ${sourcePath}`);
        options.input = sourcePath;
      },
      err => {
        console.log(err); // TODO send to GUI
      }
    );
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.destinationPath)
  .distinctUntilChanged()
  .subscribe(destinationPath => {
    fsExists(
      destinationPath,
      () => {
        console.log(`Setting destination path to ${destinationPath}`);
        options.output = destinationPath;
      },
      err => {
        console.log(err);
        console.log(`Folder will be created`);
        options.output = destinationPath; // TODO inform gui
      }
    );
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.isEncryption)
  .distinctUntilChanged()
  .subscribe(isEncryption => {
    console.log(`Setting ${isEncryption ? 'encryption' : 'decryption'}...`);
    if (isEncryption) {
      options.func = electionCipher.encrypt;
    } else {
      options.func = electionCipher.decrypt;
    }
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.isOptionsFromFile)
  .distinctUntilChanged()
  .subscribe(isOptionsFromFile => {
    console.log(`Options from file: ${isOptionsFromFile ? 'ON' : 'OFF'}.`);
    options.isOptionsFromFile = isOptionsFromFile;
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.permutationFromGui)
  .distinctUntilChanged((prev, curr) => {
    prev.every((el, i) => el === curr[i])
  })
  .subscribe(permutationFromGui => {
    console.log(`Setting GUI permutation to ${permutationFromGui.join('-')}`);
    options.permutationFromGui = permutationFromGui;
  });
