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
import tea = require('./algorithms/tea');
import knapsack = require('./algorithms/knapsack');

interface Options {
  watch: boolean;
  input: string;
  output: string;
  optionsPath: string;
  funcE: Function;
  funcD: Function;
  isDecryption: boolean;
  isOptionsFromFile: boolean;
  // key: Buffer;
  // iv: Buffer;
  // mode: string;
  bytes: number;
  P: number[];
  M: number;
  N: number;
}

interface GuiSettings {
  watch: boolean;
  sourcePath: string;
  destinationPath: string;
  isEncryption: boolean;
  isOptionsFromFile: boolean;
}

const defaults = {
  watch: true,
  input: 'input',
  output: 'output',
  optionsPath: 'crypto.json',
  funcE: knapsack.encrypt,
  funcD: knapsack.decrypt,
  isDecryption: false,
  isOptionsFromFile: true,
}

const algorithmDefaults = {
  // key: fs.readFileSync('tea-key'),
  // iv: fs.readFileSync('tea-iv'),
  // mode: 'ecb',
  bytes: 1,
  P: [2, 3, 7, 14, 30, 57, 120, 251],
  M: 41,
  N: 491,
}

// region Read crypto.json file to set global options
console.log(`Checking for crypto.json file...`);
let options: Options;
try {
  options =
    JSON.parse(fs.readFileSync(defaults.optionsPath, {
      encoding: 'utf8'}
    ))['knapsack'];
  console.log(`crypto.json file found, using its settings.`);
  options = Object.assign({}, defaults, algorithmDefaults, options);
} catch (e) {
  console.error(`File ${defaults.optionsPath} not found, using defaults.`);
  console.error(e);
  options = Object.assign({}, defaults, algorithmDefaults);
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
        console.log(`Starting process...`, Date());
        const outputPath = getCorrespondingOutputFilePath(filename);
        let cyphertext: Buffer;
        const isBmp = filename.endsWith('.bmp') ||
                      filename.endsWith('.bmp.lock');
        if (!options.isDecryption) {
          cyphertext = options.funcE(
            plaintext, options.bytes, options.P, options.M, options.N
          ).join(' ');
        } else {
          cyphertext = options.funcD(
            plaintext.toString().split(' ').map(Number),
            options.P,
            knapsack.getPrivateKey(options.P, options.M, options.N).IM,
            options.N
          );
        }
        mkdirp(path.dirname(outputPath), err => {
          if (err) throw err;
          fs.writeFile(outputPath, cyphertext, err => {
            if (err) throw err;
            console.log(`Encryption successful!`, Date());
            console.log(`\t${filename} => ${outputPath}`);
            //console.log(`\t${plaintext} => ${cyphertext}`);
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

reset()
