import * as hog from 'hog-descriptor'
import * as pixels from 'get-pixels'
import * as fs from 'fs'
import * as path from 'path'

const dir = process.argv[2];
fs.readdir(dir, (err, files) => {
  const handleSingle = (i) => {
    if (i >= files.length) {
      return;
    }

    const file = path.join(dir, files[i]);
    if (!file.endsWith('.png')) {
      handleSingle(i + 1);
      return;
    }
    if (i % 100 == 0) {
      console.log(i);
    }

    pixels.default(file, (err, pixels) => {
      const imgData = new Array(4 * pixels.shape[0] * pixels.shape[1]);
      for (let x = 0; x < pixels.shape[0]; x++) {
        for (let y = 0; y < pixels.shape[1]; y++) {
          for (let chan = 0; chan < 4; chan++) {
            imgData[x*4 + y*4*pixels.shape[0] + chan] = pixels.get(x, y, chan);
          }
        }
      }

      const image = {
        data: imgData,
        width: pixels.shape[0],
        height: pixels.shape[1]
      };

      const descriptor = hog.extractHOG(image, {
        cellSize: 4,
        blockSize: 4,
        blockStride: 2,
        bins: 6,
        norm: 'L2'
      });

      if (descriptor.length / 96 != Math.floor(descriptor.length / 96)) {
        throw "WTF"
      }
      let descriptorStr = '[';
      var blocks = [];
      for (var block = 0; block < descriptor.length / 96; block++) {
        let blockStr = '[';
        var thisBlock = [];
        for (var item = 0; item < 96; item++) {
          thisBlock.push(descriptor[block*96 + item]);
        }
        blockStr +=  thisBlock.join(',');
        blockStr += ']\n';
        blocks.push(blockStr);
      }
      descriptorStr += blocks.join(',');
      descriptorStr += ']';
      fs.writeFile(file + ".features", descriptorStr, (err) => {
        handleSingle(i + 1);
      });
    });
  };
  handleSingle(0);
});