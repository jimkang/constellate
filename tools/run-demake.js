var demakeImage = require('../demake-image');
var analyzeBrightnesses = require('../analyze-brightnesses');
// var base64 = require('node-base64-image');
var request = require('request');
var fs = require('fs');

var sb = require('standard-bail')({
  log: console.log
});

if (process.argv.length < 3) {
  console.log('Usage: node tools/run-demake.js <url>');
  process.exit();
}

var url = process.argv[2];

var reqOpts = {
  method: 'GET',
  url: url,
  encoding: null
};

request(reqOpts, sb(runDemake, logError));

function runDemake(res, body) {
  var demakeOpts = {
    buffer: body
  };
  demakeImage(demakeOpts, sb(writeDemadeImage, logError));
}

function writeDemadeImage(demadeBuffer) {
  var filename = url.replace(/[\/:]/g, '') + '.png';
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
