var loremIpsum = require('lorem-ipsum');
import fs = require('fs');
import path = require('path');

if (process.argv.length < 2 + 1) {
  console.log(
    `
    Please provide one, two or three arguments.
    First argument is an existing folder where mock text will be generated.
    Second argument is the number of generated files. Defaults to 100.
    Third argument is the extension (without leading dot). Defaults to txt.
    `
  );
  throw new Error(`Invalid number of arguments`);
}

const outputPath: string = process.argv[2];
const count: number = +process.argv[3] || 100;
const extension: string = process.argv[4] || 'txt';

console.log(
  `
  Generating mock data with the following parameters:
    outputPath = ${outputPath}
    count = ${count}
    extension = ${extension}
  `
)

const filenameGenerator = (length: number = 8) =>
  (Math.random() + 1).toString(36).slice(2, length + 2);

const loremimpsumGenerator = (paragraphCount: number = 10) =>
  loremIpsum({
    units: 'paragraphs',
    count: paragraphCount
  })

Array(count)
  .fill(undefined)
  .map(_ => filenameGenerator())
  .forEach(filename => {
    const fullFilename = path.join(outputPath, `${filename}.${extension}`);
    console.log(`Generating ${fullFilename}...`)
    fs.writeFile(fullFilename, loremimpsumGenerator(), err => {
      if (err) throw err;
      console.log(`Generate ${fullFilename} successfully.`)
    }
    );
  });
