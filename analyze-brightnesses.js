var Jimp = require('jimp');
var pluck = require('lodash.pluck');

const maxRGBTotal = 255 * 3;
const maxAlpha = 255;

function analyzeBrightnesses(buffer, done) {
  var totalOfNormalizedBrightnesses = 0;
  var pixelAnalyses = [];
  var meanNormalizedBrightness;
  var bucketsForStdDevsOverMean = {};
  var variance;
  var stddev;

  Jimp.read(buffer, analyzeImage);

  function analyzeImage(error, image) {
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, analyzePixel);
    meanNormalizedBrightness = totalOfNormalizedBrightnesses/pixelAnalyses.length;
    pixelAnalyses.forEach(addSquaredDiffFromMean);
    variance = pluck(pixelAnalyses, 'sqDiffFromMean').reduce(sum, 0)/pixelAnalyses.length;
    stddev = Math.sqrt(variance);
    pixelAnalyses.forEach(putIntoBucket);

    var report = {
      stddev,
      meanNormalizedBrightness,
      bucketsForStdDevsOverMean,
      width: image.bitmap.width,
      height: image.bitmap.height
    };
    done(null, report);

    function analyzePixel(x, y, idx) {
      var normalizedBrightness = image.bitmap.data[idx + 3]/maxAlpha *
          (image.bitmap.data[idx + 0] +
            image.bitmap.data[idx + 1] + 
            image.bitmap.data[idx + 2])/maxRGBTotal;

      pixelAnalyses.push({idx, x, y, normalizedBrightness});
      totalOfNormalizedBrightnesses += normalizedBrightness;
    }    
  }

  function putIntoBucket(analysis) {
    var stddevsAboveMean = ~~(analysis.diff/stddev);
    var bucket = bucketsForStdDevsOverMean[stddevsAboveMean];
    if (!bucket) {
      bucket = [];
      bucketsForStdDevsOverMean[stddevsAboveMean] = bucket;
    }
    bucket.push(analysis);
  }

  function addSquaredDiffFromMean(analysis) {
    var diff = analysis.normalizedBrightness - meanNormalizedBrightness;
    analysis.diff = diff;
    analysis.sqDiffFromMean = diff * diff;
  }
}

function sum(total, x) {
  return total + x;
}

module.exports = analyzeBrightnesses;
