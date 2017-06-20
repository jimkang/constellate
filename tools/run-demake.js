var demakeImage = require('../demake-image');
var analyzeBrightnesses = require('../analyze-brightnesses');
// var base64 = require('node-base64-image');
var request = require('request');
var fs = require('fs');
var makeStarBitmap = require('../make-star-bitmap');

var sb = require('standard-bail')({
  log: console.log
});

if (process.argv.length < 3) {
  console.log('Usage: node tools/run-demake.js <url>');
  process.exit();
}

var url = process.argv[2];
var originalBuffer;
var originalWidth;
var originalHeight;
var filename;

var reqOpts = {
  method: 'GET',
  url: url,
  encoding: null
};

request(reqOpts, sb(runDemake, logError));

function runDemake(res, body) {
  originalBuffer = body;
  var demakeOpts = {
    buffer: originalBuffer
  };
  demakeImage(demakeOpts, sb(writeDemadeImage, logError));
}

function writeDemadeImage(demadeBuffer, width, height) {
  originalWidth = width;
  originalHeight = height;

  filename = url.replace(/[\/:]/g, '') + '.png';
  fs.writeFileSync(filename, demadeBuffer);
  console.log('Wrote', filename);

  analyzeBrightnesses(demadeBuffer, sb(makeStars, logError));
}

function logError(error) {
  console.log(error);
}

function makeStars(report) {
  console.log(JSON.stringify(report, null, 2));
  var brightest = [];

  var stdDevsOver = Object.keys(report.bucketsForStdDevsOverMean)
    .sort(compareIntStrings);
  for (var i = 0; i < stdDevsOver.length; ++i) {
    debugger;
    brightest = brightest.concat(report.bucketsForStdDevsOverMean[stdDevsOver[i]]);
    if (brightest.length > 10) {
      break;
    }
  }

  console.log('brightest', brightest);
  asciiMap(brightest, report.width, report.height);

  var scaledBrightest = brightest.map(scaleStarPointToOriginal);
  console.log(scaledBrightest);

  var starBitmap = makeStarBitmap(
    scaledBrightest, originalWidth, originalHeight, sb(writeStarImage, logError)
  );

  function writeStarImage(bitmapBuffer) {
    fs.writeFileSync('stars-' + filename, bitmapBuffer);
  }

  function scaleStarPointToOriginal(point) {
    return {
      x: (point.x + 0.5) / report.width * originalWidth,
      y: (point.y + 0.5) / report.width * originalHeight
    };
  }
}

function compareIntStrings(a, b) {
  if (+a > +b) {
    return -1;
  }
  else {
    return 1;
  }
}

function asciiMap(points, width, height) {
  var rows = [];
  for (var j = 0; j < height; ++j) {
    let row = [];
    for (var i = 0; i < width; ++i) {
      row.push('.');
    }
    rows.push(row);
  }

  points.forEach(markInMap);
  rows.forEach(printRow);

  function markInMap(point) {
    rows[point.y][point.x] = 'o';
  }

  function printRow(row) {
    console.log(row.join(''));
  }
}
