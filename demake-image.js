var Jimp = require('jimp');

function demakeImage(opts, done) {
  var buffer;
  var width;
  var height;

  if (opts) {
    buffer = opts.buffer;
    width = opts.width;
    height = opts.height;
  }

  Jimp.read(buffer, manipulateImage);

  function manipulateImage(error, image) {
    if (error) {
      done(error);
    }
    else {
      var scaleDownSize;
      var scaleUpSize;
      var exponent;

      width = image.bitmap.width;
      height = image.bitmap.height;

      var largestOriginalDimension = width;
      if (largestOriginalDimension < height) {
        largestOriginalDimension = height;
      }
      var nearestPowerOf2 = ~~(Math.log2(largestOriginalDimension));
      exponent = Math.round(nearestPowerOf2 / 2);

      if (exponent < 2) {
        exponent = 2;
      }

      scaleDownSize = Math.pow(2, exponent);
      // scaleUpSize = Math.pow(2, exponent + 3 + probable.roll(5));

      console.log(
        'width', width, 'height', height,
        'exponent', exponent,
        'scaleDownSize', scaleDownSize, 'scaleUpSize', scaleUpSize
      );

      image.scaleToFit(scaleDownSize, scaleDownSize, Jimp.RESIZE_NEAREST_NEIGHBOR);
      // image.scaleToFit(scaleUpSize, scaleUpSize, Jimp.RESIZE_NEAREST_NEIGHBOR);
      image.getBuffer(Jimp.MIME_PNG, done);
    }
  }
}

module.exports = demakeImage;