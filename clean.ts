import fs = require('fs');
import glob = require('glob');

const folder = process.argv[2] || 'magic';

glob(
  `${folder}/**/*`,
  {
    ignore: [`${folder}/crypto.json`],
    nodir: true
  },
  (err, paths) => {
    paths.forEach(path => {
      console.log(`Removing '${path}'...`)
      fs.unlink(path, err => {
        if (err) throw err;
      });
    })
  }
)
