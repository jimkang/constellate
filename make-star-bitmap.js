var pureimage = require('pureimage');
var stream = require('stream');

function makeStarBitmap(starPoints, width, height, done) {
  var starRadius = width/100;
  if (starRadius < 2) {
    starRadius = 2;
  }

  var starImage = pureimage.make(width, height);

  starPoints.forEach(drawStar);

  var buffer = Buffer.alloc(0);
  var bufferCollector = new stream.Writable({
    write(chunk, enc, cb) {
      // console.log('enc', enc);
      buffer = Buffer.concat([buffer, chunk]);
      cb();
    }
  })
  pureimage.encodePNG(starImage, bufferCollector, passBuffer);

  function passBuffer(error) {
    if (error) {
      done(error);
    }
    else {
      done(null, buffer);
    }
  }

  function drawStar(starPoint) {
    var ctx = starImage.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(starPoint.x, starPoint.y - starRadius);
    ctx.arc(
      starPoint.x, starPoint.y,
      starRadius,
      0,
      2 * Math.PI,
      false
    );
    ctx.fill();
  }
}

module.exports = makeStarBitmap;

