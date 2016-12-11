'use strict';

var _hogDescriptor = require('hog-descriptor');

var hog = _interopRequireWildcard(_hogDescriptor);

var _getPixels = require('get-pixels');

var pixels = _interopRequireWildcard(_getPixels);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var dir = process.argv[2];
fs.readdir(dir, function (err, files) {
  var handleSingle = function handleSingle(i) {
    if (i >= files.length) {
      return;
    }

    var file = path.join(dir, files[i]);
    if (!file.endsWith('.png')) {
      handleSingle(i + 1);
      return;
    }
    if (i % 100 == 0) {
      console.log(i);
    }

    pixels.default(file, function (err, pixels) {
      var imgData = new Array(4 * pixels.shape[0] * pixels.shape[1]);
      for (var x = 0; x < pixels.shape[0]; x++) {
        for (var y = 0; y < pixels.shape[1]; y++) {
          for (var chan = 0; chan < 4; chan++) {
            imgData[x * 4 + y * 4 * pixels.shape[0] + chan] = pixels.get(x, y, chan);
          }
        }
      }

      var image = {
        data: imgData,
        width: pixels.shape[0],
        height: pixels.shape[1]
      };

      var descriptor = hog.extractHOG(image, {
        cellSize: 4,
        blockSize: 4,
        blockStride: 2,
        bins: 6,
        norm: 'L2'
      });

      if (descriptor.length / 96 != Math.floor(descriptor.length / 96)) {
        throw "WTF";
      }
      var descriptorStr = '[';
      var blocks = [];
      for (var block = 0; block < descriptor.length / 96; block++) {
        var blockStr = '[';
        var thisBlock = [];
        for (var item = 0; item < 96; item++) {
          thisBlock.push(descriptor[block * 96 + item]);
        }
        blockStr += thisBlock.join(',');
        blockStr += ']\n';
        blocks.push(blockStr);
      }
      descriptorStr += blocks.join(',');
      descriptorStr += ']';
      fs.writeFile(file + ".features", descriptorStr, function (err) {
        handleSingle(i + 1);
      });
    });
  };
  handleSingle(0);
});
