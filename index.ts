// Core stuff
import fs = require('fs');
import yargs = require('yargs');
import chokidar = require('chokidar');
import mkdirp = require('mkdirp');
import path = require('path');
import WebSocket = require('ws');
import Rx = require('rxjs/Rx');
import util = require('util');
import recursive = require('recursive-readdir');

// Algorithms
import shiftByN = require('./algorithms/shift-by-n');
import simpleSubstitution = require('./algorithms/simple-substitution');
import codebookCypher = require('./algorithms/codebook-cypher');
import doubleTransposition = require('./algorithms/double-transposition');
import electionCipher = require('./algorithms/election-cipher');
import rc4 = require('./algorithms/rc4');

interface Options {
  watch: boolean;
  input: string;
  output: string;
  optionsPath: string;
  func: Function;
  isDecryption: boolean;
  permutationFromGui: number[];
  isOptionsFromFile: boolean;
  // permutation: number[];
  // prefixes: string[];
  key: string;
  numberOfBits: number;
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
  watch: false,
  input: 'input',
  output: 'output',
  optionsPath: 'crypto.json',
  func: rc4.encrypt,
  isDecryption: false,
  permutationFromGui: [1, 0],
  isOptionsFromFile: true,
}

// Algorithm defaults
// const electionDefaults = {
//   permutation: [1, 0],
//   prefixes: ['san', 'los', 'las', 'de', 'saint', 'st'],
// };

const rc4Defaults = {
  key: '00010110',
  numberOfBits: 4,
}

// region Read crypto.json file to set global options
console.log(`Checking for crypto.json file...`);
let options: Options;
try {
  options =
    JSON.parse(fs.readFileSync(defaults.optionsPath, {
      encoding: 'utf8'}
    ))['rc4'];
  console.log(`crypto.json file found, using its settings.`);
  options = Object.assign({}, options, defaults);
} catch (e) {
  console.error(`File ${defaults.optionsPath} not found, using defaults.`);
  console.error(e);
  options = Object.assign({}, defaults, rc4Defaults);
}

console.log(`Settings loaded.`);
console.log(options);
// endregion

// region Read crypto-log.json filename
console.log(`Checking for crypto-log.json file...`);
let state = [];
try {
  state = JSON.parse(fs.readFileSync('crypto-log.json', { encoding: 'utf8' }));
  console.log(`crypto-log.json file found`);
} catch (e) {
  state = [];
  console.log(`crypto-log.json file not found; creating one...`);
  fs.writeFileSync('crypto-log.json', JSON.stringify(state));
  console.log(`crypto-log.json created.`);
}

function addEntryToStateAndSave(filename: string): void {
  state = state.concat({
    filename,
    timestamp: new Date().getTime()
  });
}

function isNewOrEdited(filename: string,
                       ifYes: Function,
                       ifNo: Function): void {
  fs.lstat(filename, (err, stats) => {
    if (err || !stats.isFile()) {
      ifNo(err || `${path} is not a file.`);
    } else {
      console.log(util.inspect(stats));
    }
  });
}
// endregion

function encrypt(filename: string): void {
  fs.lstat(filename, (err, stats) => {
    if (err) throw err;
    const mtime = stats.mtime;
    // If the file is not in the log, or if it is but it has been modified
    // since it was encrypted => encrypt it. Otherwise, do not.
    const stateEntry = state.find(entry => entry.path === filename);
    if (!(stateEntry && stateEntry.date > new Date(mtime).getTime())) {
      // File should be encrypted
      fs.readFile(filename, (err, plaintext: Buffer) => {
        if (err) throw err;
        const outputPath = getCorrespondingOutputFilePath(filename);
        const cyphertext: Buffer =
          rc4.getBuffer(rc4.encrypt(
            plaintext,
            options.numberOfBits,
            options.key
          ));
        mkdirp(path.dirname(outputPath), err => {
          if (err) throw err;
          fs.writeFile(outputPath, cyphertext, err => {
            if (err) throw err;
            console.log(`Encryption successful!`);
            console.log(`\t${filename} => ${outputPath}`);
            console.log(`\t${plaintext} => ${cyphertext}`);
            if (!stateEntry) {
              state = state.concat({
                path: filename,
                date: new Date().getTime(),
              });
            } else {
              stateEntry.date = new Date().getTime();
            }
            fs.writeFile('crypto-log.json', JSON.stringify(state), err => {
              if (err) throw err;
            });
          });
        });
      });
    } else {
      // File should not be encrypted
      const reason = `Already processed this file ` +
        `${(new Date().getTime() - stateEntry.date) / 1000} seconds ago`;
      console.log(`Skipping file ${filename}. Reason: ${reason}.`);
    }
  });
}

function getCorrespondingOutputFilePath(inputFilePath: string): string {
  const regexp = new RegExp(`^${options.input}`);
  const outputPath = inputFilePath.replace(regexp, options.output);
  if (!options.isDecryption) {
    return outputPath.concat('.lock');
  } else {
    return outputPath.slice(0, -'.lock'.length);
  }
}

function deleteEncrypted(pathToFile: string): void {
  const pathToOutputFile = getCorrespondingOutputFilePath(pathToFile);
  fs.unlink(pathToOutputFile, err => {
    if (err) throw err;
    console.log(`${pathToFile} deleted => ${pathToOutputFile} deleted`);
  })
}

let watcher: any;

function startWatching(): void {
  console.log(`Start watching for ${options.input}`);
  watcher = chokidar.watch(`${options.input}/**/*.*`, {
    //ignored: [`**/*.lock`]
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
      options.watch = true;
      startWatching();
    } else {
      console.log(`Stop watching...`);
      options.watch = false;
      stopWatching();
    }
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.sourcePath)
  .distinctUntilChanged()
  .filter(sourcePath => sourcePath !== options.input)
  .subscribe(sourcePath => {
    fsExists(
      sourcePath,
      () => {
        console.log(`Setting source path to ${sourcePath}`);
        reset();
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
  .filter(destinationPath => destinationPath !== options.output)
  .subscribe(destinationPath => {
    fsExists(
      destinationPath,
      () => {
        console.log(`Setting destination path to ${destinationPath}`);
        reset();
        options.output = destinationPath;
      },
      err => {
        console.log(`Folder ${destinationPath} will be created`);
        reset();
        options.output = destinationPath;
      }
    );
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.isEncryption)
  .distinctUntilChanged()
  .subscribe(isEncryption => {
    console.log(`Setting ${isEncryption ? 'encryption' : 'decryption'}...`);
    //reset();
    options.isDecryption = !isEncryption;
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.isOptionsFromFile)
  .distinctUntilChanged()
  .filter(isOptionsFromFile => isOptionsFromFile !== options.isOptionsFromFile)
  .subscribe(isOptionsFromFile => {
    console.log(`Options from file: ${isOptionsFromFile ? 'ON' : 'OFF'}.`);
    reset();
    options.isOptionsFromFile = isOptionsFromFile;
  });

connectionMessageSubject
  .map((guiSettings: GuiSettings) => guiSettings.permutationFromGui)
  .distinctUntilChanged((prev, curr) => {
    return curr.length == prev.length && curr.every((el, i) => el === prev[i]);
  })
  .filter(permutationFromGui => {
    return !options.isOptionsFromFile;
  })
  .subscribe(permutationFromGui => {
    console.log(`Setting GUI permutation to ${permutationFromGui.join('-')}`);
    reset();
    options.permutationFromGui = permutationFromGui;
  });

function reset() {
  console.log(`This change requires to clean state!`);
  console.log(`Cleaning state...`)
  state = [];
  fs.writeFileSync('crypto-log.json', JSON.stringify(state));
  if (options.watch) {
    stopWatching();
    startWatching();
  }
}
