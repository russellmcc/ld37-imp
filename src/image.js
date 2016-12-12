// @flow

import * as hog from 'hog-descriptor';

let codebook: ?Array<Array<number>>;

export function setCodebook(c: Array<Array<number>>) {
  codebook = c;
}

const BLOCK_SIZE = 4;
const BINS = 6;

export function applyAlphaToWhiteBackground(image: ImageData) {
  // assume white background.
  for (let x = 0; x < image.width; ++x) {
    for (let y = 0; y < image.height; ++y) {
      const alpha = image.data[(x + y*image.width) * 4 + 3] / 255
      for (var i = 0; i < 3; ++i) {
        image.data[(x + y*image.width) * 4 + i] =
          (1 - alpha)*255 + alpha * image.data[(x + y*image.width) * 4 + i];
      }
      image.data[(x + y*image.width) * 4 + 3] = 255;
    }
  }
};

let targetImageHOG: ?Array<number>;

const workingCanvas = document.createElement('canvas');
workingCanvas.height = 128;
workingCanvas.width = 128;
const workingCtx = workingCanvas.getContext('2d');

function l2distSquared(a: Array<number>, b: Array<number>) {
  let sum = 0;
  if (a.length != b.length) {
    throw "uh oh!";
  }
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }

  return sum / a.length;
}

function l2dist(a: Array<number>, b: Array<number>) {
  return Math.sqrt(l2distSquared(a, b));
}

function cosineSimilarity(a: Array<number>, b: Array<number>) {
  let sum = 0;
  let sumA = 0;
  let sumB = 0;

  if (a.length != b.length) {
    console.error('a and b must be the same length!');
    throw "uh oh!";
  }
  for (let i = 0; i < a.length; i++) {
    sumA += a[i]*a[i];
    sumB += b[i]*b[i];
    sum += a[i]*b[i];
  }

  sum /= Math.sqrt(sumA * sumB);
  return sum;
}

function gaussianKernel(a: Array<number>, b: Array<number>) {
  const sigma = 0.1;
  return Math.exp(-(l2distSquared(a, b)/(2 * sigma)));
}

type Rect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

function getBoundingBox(image: ImageData): Rect {
  let minX = image.width;
  let minY = image.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < image.height; ++y) {
    for (let x = 0; x < image.width; ++x) {
      const alpha = image.data[(x + y*image.width) * 4 + 3] / 255
      if (alpha !== 0) {
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
      }
    }
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function calculateHOG(source: HTMLCanvasElement | HTMLImageElement): Array<number> {
  if (!codebook) {
    console.error("No HOG codebook!");
    return [];
  }
  let box;
  if (source instanceof HTMLCanvasElement) {
    box = {x: 0, y: 0, width:source.width, height: source.height};
    // const ctx = source.getContext('2d');
    // if (!ctx) {
    //   console.error("couldn't get context!");
    //   return [];
    // }
    // const sourceImage = ctx.getImageData(0, 0, source.width, source.height);
    // box = getBoundingBox(sourceImage);
  } else {
    box = {x: 0, y: 0, width:source.width, height: source.height};
  }
  const workCtx = workingCtx;
  if (!workCtx) {
    console.error("couldn't get context!");
    return [];
  }
  workCtx.clearRect(0, 0, workingCanvas.width, workingCanvas.height);
  if (box.width > box.height) {
    workCtx.drawImage(source, box.x, box.y, box.width, box.height,
                      0, 0, workingCanvas.width, workingCanvas.width / box.width * box.height);
  } else {
    workCtx.drawImage(source, box.x, box.y, box.width, box.height,
                      0, 0, workingCanvas.height / box.height * box.width, workingCanvas.height);
  }

  const image = workCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height);
  applyAlphaToWhiteBackground((image: any));
  const hog_features = hog.extractHOG(image, {
    cellSize: 4,
    blockSize: BLOCK_SIZE,
    blockStride: 2,
    bins: BINS,
    norm: 'L2'
  });

  // At this point, we have the feature set.
  // We need to convert each feature to a codeword and create
  // a code histogram.
  const histogram: Array<number> = new Array(codebook.length).fill(0);

  const blockCount = BINS * BLOCK_SIZE * BLOCK_SIZE;

  for (let i = 0; i < hog_features.length; i += blockCount) {
    for (let code = 0; code < codebook.length; code++) {
      histogram[code] += gaussianKernel(codebook[code], hog_features.slice(i, i + blockCount));
    }
  }

  for (let code = 0; code < codebook.length; code++) {
    histogram[code] /= hog_features.length / blockCount;
  }
  return histogram;
}

export function setTargetImage(image: HTMLCanvasElement | HTMLImageElement) {
  targetImageHOG = calculateHOG(image);
};

function compareHOGs(a: Array<number>, b: Array<number>): number {
  return 1000 * l2dist(a, b);
};

export function scoreAgainstTarget(image: HTMLCanvasElement) : number {
  const target = targetImageHOG;
  if (!target) {
    return 0;
  }

  let current = calculateHOG(image);
  return compareHOGs(target, current);
};