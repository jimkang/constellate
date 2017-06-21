/* global Buffer */

var pureimage = require('pureimage');
var stream = require('stream');
var d3 = require('d3-shape');
var curry = require('lodash.curry');
var accessor = require('accessor');
var triangulate = require('delaunay-triangulate');
var probable = require('probable');

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
  // console.log(points.map(xyTo2D));
  var triangles = triangulate(points.map(xyTo2D));  
  console.log(triangles);
  var edges = triangles.reduce(saveEdges, []);
  // var edges = triangles.reduce(saveShortestEdges, []);
  console.log(edges);
  var edgeCounts = edges.reduce(countEdge, {});
  console.log(edgeCounts);
  // var commonEdges = getCommonEdges(edgeCounts);
  // console.log(commonEdges);
  var nonCommonEdges = getNonCommonEdges(edgeCounts);
  console.log(nonCommonEdges);
  
  var lines = nonCommonEdges.map(edgeToLine);
  console.log(lines);

  ctx.beginPath();
  // boneLine.context(ctx)(points);
  lines.forEach(curry(drawLine)(ctx));
  ctx.stroke();
  // console.log(boneLine(points));

  function edgeToLine(edge) {
    return [points[edge[0]], points[edge[1]]];
  }

  function saveShortestEdges(edges, triangle) {
    var localEdges = [
      triangle.slice(0, 2),
      triangle.slice(1, 3),
      [triangle[2], triangle[0]]
    ];
    var localLengths = localEdges.map(edgeToLine).map(getLineLength);
    // console.log('localLengths', localLengths);
    var indexOfLongest = 0;
    for (var i = 1; i < localLengths.length; ++i) {
      if (localLengths[i] > localLengths[indexOfLongest]) {
        indexOfLongest = i;
      }
    }
    // console.log('indexOfLongest', indexOfLongest);

    for (var j = 0; j < localEdges.length; ++j) {
      if (j !== indexOfLongest) {
        edges.push(localEdges[j]);
      }
    }
    return edges;
  }
}

// function compareXValues(a, b) {
//   if (a.x < b.x) {
//     return -1;
//   }
//   else {
//     return 1;
//   }
// }

function xyTo2D(xy) {
  return [xy.x, xy.y];
}

function saveEdges(edges, triangle) {
  edges.push(triangle.slice(0, 2).sort());
  edges.push(triangle.slice(1, 3).sort());
  edges.push([triangle[2], triangle[0]].sort());
  return edges;
}

function countEdge(counts, edge) {
  var key = JSON.stringify(edge);
  var count = counts[key];
  if (isNaN(count)) {
    count = 1;
  }
  else {
    count += 1;
  }
  counts[key] = count;
  return counts;
}

function getCommonEdges(counts) {
  var commonEdges = [];
  for (var key in counts) {
    if (counts[key] > 1) {
      commonEdges.push(JSON.parse(key));
    }
  }
  return commonEdges;
}

function getNonCommonEdges(counts) {
  var nonCommonEdges = [];
  for (var key in counts) {
    if (counts[key] < 2) {
      nonCommonEdges.push(JSON.parse(key));
    }
  }
  return nonCommonEdges;
}

function drawLine(ctx, line) {
  ctx.moveTo(line[0].x, line[0].y);
  ctx.lineTo(line[1].x, line[1].y);
}

function getLineLength(line) {
  var xDist = line[0].x - line[1].x;
  var yDist = line[0].y - line[1].y;
  return Math.sqrt(xDist * xDist + yDist * yDist);
}

module.exports = makeStarBitmap;
