/* global Buffer */

var pureimage = require('pureimage');
var stream = require('stream');
var d3 = require('d3-shape');
var curry = require('lodash.curry');
var accessor = require('accessor');

var boneCurve = d3.curveNatural;
var boneLine = d3.line()
  .x(accessor('x'))
  .y(accessor('y'));

boneLine.curve(boneCurve);


function makeStarBitmap(starPoints, width, height, done) {
  var starRadius = width/100;
  if (starRadius < 2) {
    starRadius = 2;
  }

  var starImage = pureimage.make(width, height);
  var ctx = starImage.getContext('2d');
  ctx.strokeStyle = '#00c0f0';
  drawBoneLines(ctx, starPoints);
  ctx.fillStyle = 'white';
  starPoints.forEach(curry(drawStar)(ctx));

  // Write it out to a buffer.
  var buffer = Buffer.alloc(0);
  var bufferCollector = new stream.Writable({
    write(chunk, enc, cb) {
      // console.log('enc', enc);
      buffer = Buffer.concat([buffer, chunk]);
      cb();
    }
  });
  pureimage.encodePNG(starImage, bufferCollector, passBuffer);

  function passBuffer(error) {
    if (error) {
      done(error);
    }
    else {
      done(null, buffer);
    }
  }

  function drawStar(ctx, starPoint) {
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

function drawBoneLines(ctx, points) {
  ctx.beginPath();
  boneLine.context(ctx)(points);
  ctx.stroke();
  // console.log(boneLine(points));
}

// function compareXValues(a, b) {
//   if (a.x < b.x) {
//     return -1;
//   }
//   else {
//     return 1;
//   }
// }

module.exports = makeStarBitmap;

