// @flow

import * as pixi from 'pixi.js';
import * as image from './image.js';
import * as state from './state.js';
import * as vpixi from './vpixi.js';
import * as sayings from './sayings.js';
import * as _ from 'lodash'

const renderer = new pixi.WebGLRenderer(640, 480, {transparent: true});
const bgRenderer = new pixi.WebGLRenderer(640, 480);
bgRenderer.backgroundColor = 0xFFFFFF;

const loadingStage = new pixi.Container();
const loadingSprite = new pixi.Sprite(new pixi.Texture.fromImage('loading.png'));
loadingStage.addChild(loadingSprite);

const stage = new pixi.Container();
const bgStage = new pixi.Container();
const overlay = new pixi.Container();
stage.addChild(overlay);

let currentState: state.State = {
  state: 'Init'
};

let fc = null;
let textureMap = null;
let loadedCodebook = false;
let completed = 0;
let gameScore = 0;

let imageSprite = new pixi.Sprite();
stage.addChild(imageSprite);
imageSprite.visible = false;
imageSprite.alpha = 0.1;
imageSprite.x = 50;
imageSprite.y = 37;
imageSprite.width = 540;
imageSprite.height = 405;

const GRADING_SCROLL_TIME = 3;
const GRADING_TWIRL_TIME = 2;
const NUM_IMAGES = 5;
const INK_DISTANCE_MIN = 100;
const INK_DISTANCE_MAX = 2000;
const INK_TOP = 100;
const INK_BOTTOM = 100 + 75;
const INK_WIDTH = 61;

function imageScoreToGameScore(imageScore) {
  if (imageScore < 1) {
    return 2;
  } else if (imageScore < 3) {
    return 1;
  } else if (imageScore < 10) {
    return -1;
  } else {
    return -2;
  }
}

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
}

let randomImages = []
for (let t = 0; t < NUM_IMAGES; t++) {
  randomImages.push(t);
}
randomImages = _.shuffle(randomImages);
let randomIndex = 0;

function loadRandomImage() {
  const imageInd = randomImages[randomIndex] + 1;
  randomIndex++;
  if (randomIndex >= NUM_IMAGES) {
    randomIndex = 0;
  }
  console.log(imageInd);
  const imageNum = padDigits(imageInd, 2);
  loadImage("images/imp-" + imageNum + ".png", "images/photo-" + imageNum + ".jpg");
};

let mouseX = 0;
let mouseY = 0;

function onMove(e) {
   const rect = document.getElementById('wrapper').getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
}

function doClick(e) {
  if (currentState.state === 'ReadyToDraw') {
    switchState({state:'Drawing', texture:currentState.texture, time:60, distance: 0, impFrame: 0});
  }
  else if (currentState.state === 'Grading' && currentState.time > GRADING_SCROLL_TIME + GRADING_TWIRL_TIME) {
    if (gameScore <= -3) {
      switchState({state: 'GameOver'});
    } else if (gameScore >= 3) {
      switchState({state: 'YouWin', scrapbookPage: 0});
    } else {
      loadRandomImage();
    }
  }
  else if (currentState.state === 'GameOver') {
    gameScore = 0;
    completed = 0;
    switchState({state:'Intro'});
  }
  else if (currentState.state === 'YouWin') {
    currentState.scrapbookPage += 1;
    if (currentState.scrapbookPage >= completed) {
      currentState.scrapbookPage = 0;
    }
  }
  else if (currentState.state === 'Intro') {
    loadRandomImage();
  }
  else if (currentState.state === 'Drawing') {
    const rect = document.getElementById('wrapper').getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < INK_WIDTH && y >= INK_TOP && y < INK_BOTTOM) {
      if (fc) {
        fc.freeDrawingBrush.distanceTraveled = 0;
      }
    }
  }
}

document.addEventListener('click', (doClick: any), true);
document.addEventListener('mousemove', (onMove: any), true);

function getTextureFromDrawing(fc) {
  if (!fc) {
    console.error("programmer is dumb");
    return;
  }
  const tCanvas = document.createElement('canvas');
  tCanvas.width = 256;
  tCanvas.height = 256 / fc.width * fc.height;
  const ctx = tCanvas.getContext('2d');
  if (!ctx) {
    console.error("no context!");
    return;
  }

  ctx.clearRect(0,0, tCanvas.width, tCanvas.height);
  const source: any = document.getElementsByClassName('upper-canvas')[0];
  ctx.drawImage(source,
                0, 0, source.width, source.height,
                0, 0, tCanvas.width, tCanvas.height);
  return pixi.Texture.fromCanvas(tCanvas);
}

function switchState(newState: state.State) {
  if (!fc) {
    return;
  }
  var isDrawing = newState.state === 'Drawing';
  document.dispatchEvent(new MouseEvent('mouseup'));
  fc.isDrawingMode = isDrawing;
  var upperCanvas = document.getElementsByClassName('upper-canvas')[0];
  upperCanvas.style.cursor = 'none';
  upperCanvas.hidden = !isDrawing;
  imageSprite.visible = isDrawing;

  if (newState.state === 'Drawing') {
    fc.clear();
    fc.freeDrawingBrush.distanceTraveled = 0;
    imageSprite.texture = newState.texture;
    imageSprite.width = 540;
    imageSprite.height = 540 / newState.texture.width * newState.texture.height;
    imageSprite.alpha = 0.4;
    imageSprite.y = (480 - imageSprite.height) / 2;
    fc.setWidth(imageSprite.width);
    fc.setHeight(imageSprite.height);
    (document.getElementsByClassName('canvas-container')[0].style: any).top = imageSprite.y;
    (document.getElementsByClassName('canvas-container')[0].style: any).left = 50;
  }

  currentState = newState;
};

function loadImage(sketchPath, photoPath) {
  switchState({state: 'LoadingImage'});

  const imgSketch : HTMLImageElement = document.createElement('img');
  const imgPhoto : HTMLImageElement = document.createElement('img');
  imgSketch.src = sketchPath;
  imgPhoto.src = photoPath;
  let currImageTex = null;
  let loadedSketch = false;
  let loadedImage = false;
  function transitionOut() {
    switchState({
      state: 'ReadyToDraw',
      texture: currImageTex
    });
  };

  imgSketch.addEventListener('load', () => {
    image.setTargetImage(imgSketch);
    loadedSketch = true;
    if (loadedImage) {
      transitionOut();
    }
  });

  imgPhoto.addEventListener('load', () => {
    currImageTex = new pixi.Texture(new pixi.BaseTexture(imgPhoto));
    loadedImage = true;
    if (loadedSketch) {
      transitionOut();
    }
  });
}

const loadingAnimate = () => {
  if (currentState.state !== 'Init') {
    return;
  }

  loadingSprite.rotation += 0.01;

  loadingSprite.x = 640/2 - (200 * Math.cos(loadingSprite.rotation) + 50 * Math.sin(loadingSprite.rotation));
  loadingSprite.y = 480/2 - (50 * Math.cos(loadingSprite.rotation) + 200 * Math.sin(loadingSprite.rotation));
  loadingSprite.width = 400;
  loadingSprite.height = 100;

  renderer.render(loadingStage);
  bgRenderer.render(bgStage);
  requestAnimationFrame(() => {loadingAnimate();});
};
loadingAnimate();

function showStateBG(s : state.State): vpixi.Container {
  if (s.state === 'Drawing') {
    return {
    type: 'Container',
    x: 0,
    y: 0,
    children: [{
      type: 'Sprite',
      x:0,
      y:0,
      width:640,
      height:480,
      texture:'imp_bg.png',
      rotation:0,
    }, {
      type: 'Sprite',
      x: 0,
      y: 100,
      width:61,
      height: 75,
      texture: 'imp_ink.png',
      rotation: 0,
    }],};
  }
  if (s.state === 'Grading' && s.time < GRADING_SCROLL_TIME) {
    let bg_frame;
    const bg_roll_time = 0.5;
    const spin_speed = 8;
    if (s.time < bg_roll_time) {
      bg_frame = 1 + Math.floor(s.time/bg_roll_time * 5);
    } else {
      bg_frame = 6 + Math.floor((s.time - 1) * spin_speed) % 2;
    }
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Sprite',
        x:0,
        y:0,
        width:640,
        height:480,
        texture:'imp_bg_unroll-'+padDigits(bg_frame, 2)+'.png',
        rotation:0,
      }]};
  } else if (s.state === 'Grading') {
    const face = s.time < GRADING_SCROLL_TIME + GRADING_TWIRL_TIME ? "neutral" : (
      s.score > 0 ? 'happy' : 'angry'
    );
    const children = [{
        type: 'Sprite',
        x:0,
        y:0,
        width:640,
        height:480,
        texture:'imp_warlock_blank-01.png',
        rotation:0,
      }, {
        type: 'Sprite',
        x: 490-71/2, y:225-97/2, width:71, height:97,
        texture:"imp_warlock_" + face + "-02.png"
      }];
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children,
    };
  } else if (s.state === 'YouWin') {
    const children = [{
      type: 'Sprite',
      x:0,
      y:0,
      width:640,
      height:480,
      texture:'imp_warlock_scrapbook-01.png',
    }, {
      type: 'Sprite',
      x: 378,
      y: 178 - 100,
      texture: "completed" + s.scrapbookPage,
      rotation: 0,
      width: 151,
      height: 100,
    }, {
      type: 'Text',
      y: 178 - 100,
      x: 100,
      text: 'Best Friends\nMake The\nBestMemories.',
    }];
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children,
    };
  }
  return {
    type: 'Container',
    x: 0,
    y: 0,
    children: [{
      type: 'Sprite',
      alpha: 0.25,
      x:0,
      y:0,
      width:640,
      height:480,
      texture:'imp_bg_unroll-01.png',
      rotation:0,
    }]};
};

function showState(s : state.State): vpixi.Container {
  if (s.state === 'LoadingImage') {
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Text',
        x: 50,
        y: 60,
        text: 'Please wait for Moorcock to\n find a great Photo-Op'
      }],
    };
  } else if (s.state === 'ReadyToDraw') {
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Text',
        x: 20,
        y: 50,
        text:"Moorcock is ready for you to draw!\nYou\'ll have only 60 seconds to draw,\nso there's no time to delay!\nDraw by using the mouse.\nIf you run out of ink, refill by\nclicking on the inkwell on the left\nof your room.\nRemember, these are special memories\nof the evil warlock's vacation,\nand he doesn't like being disappointed!\n\nClick Anywhere to continue."
      }]}
  } else if (s.state === 'Drawing') {
    const impStr = "imp_medium_" + padDigits(Math.floor(s.impFrame), 5) + ".png"; 
    const children = [{
        type: 'Text',
        x:0,
        y:0,
        text: Math.ceil(s.time).toString()
      }, {
        type: 'Sprite',
        x:mouseX - 200,
        y:mouseY,
        rotation: 0,
        width: 400,
        height: 200,
        texture: impStr,
      }];
    if (s.distance > .75 * INK_DISTANCE_MAX) {
      children.push({
        type: 'Text',
        x: 0,
        y: 100+75,
        text: 'Refill Ink!'
      });
    }
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children}
  } else if (s.state === 'Grading') {
    if (s.time < GRADING_SCROLL_TIME) {
      return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Sprite',
        x: 50,
        y: 60 + 420 * s.time / GRADING_SCROLL_TIME,
        texture: s.texture,
        rotation: 0,
        width: 540,
        height: 360,
      }]};
    }
    else {
      let subTime = (s.time - GRADING_SCROLL_TIME) / GRADING_TWIRL_TIME;
      if (subTime > 1)
        subTime = 1;
      const twirlX = 200 + 90 * subTime;
      const twirlY = 200 + 80 * subTime;
      const twirlRot = 2 + 9.8 * subTime;
      let children = [
        {
          type: 'Sprite',
          x: twirlX,
          y: twirlY,
          texture: 'white.png',
          rotation: twirlRot,
          width: 150,
          height: 100,
        },
        {
          type: 'Sprite',
          x: twirlX,
          y: twirlY,
          texture: s.texture,
          rotation: twirlRot,
          width: 150,
          height: 100,
        }, {
          type: 'Sprite',
          x: 430 - 78/2,
          y: 280 - 94/2,
          texture: 'imp_warlock_hand-03.png',
          width: 78,
          height: 94,
        },
      ];
      if (s.time > GRADING_SCROLL_TIME + GRADING_TWIRL_TIME) {
        children.push({
          type: 'Sprite',
          x: 0, y: 350, width: 640, height: 130,
          texture: 'white.png',
          rotation: 0,
        });
        children.push({
          type: 'Text',
          x: 20, y: 360,
          text: s.phrase + "\nClick to continue.",
        });
      }
      return {
      type: 'Container',
      x: 0,
      y: 0,
      children};
    }
  } else if (s.state === 'Intro') {
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Text',
        x: 20,
        y: 50,
        text:"Oh No!  You've run afoul\nof the evil warlock Moorcock!\nHe's turned you into an imp\nand has forced you to live in his \ncamera.\nYour fate from here to eternity is to\ncapture his vacation memories in ink."
      }]};
  } else if (s.state === 'GameOver') {
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Text',
        x: 20,
        y: 50,
        text:"The dread warlock Moorcock has slain\nyou for ruining his vacation memories\nwith your low-quality photographs.\nBetter luck next time!"
      }]}
  }
  return {
    type: 'Container',
    x: 0,
    y: 0,
    children: [],
  };
};

const animate = () => {
  if (!textureMap) {
    return;
  }

  if (currentState.state === 'Drawing') {
    currentState.time -= 1/60;
    if (!fc) {
      return;
    }
    currentState.distance = fc.freeDrawingBrush.distanceTraveled;
    if (currentState.distance < INK_DISTANCE_MIN) {
      fc.freeDrawingBrush.width = 4;
      fc.freeDrawingBrush.changeOpacity(1);
    } else {
      let scalar = (currentState.distance - INK_DISTANCE_MIN) / (INK_DISTANCE_MAX - INK_DISTANCE_MIN);
      if (scalar > 1) scalar = 1;
      fc.freeDrawingBrush.width = 3 * (1 - scalar) + 1;
      fc.freeDrawingBrush.changeOpacity(0.1 + 0.9 * (1-scalar));
    }

    if (Math.random() > 0.5) {
      imageSprite.alpha += 0.005;
    } else {
      imageSprite.alpha -= 0.005;
    }
    imageSprite.alpha = Math.min(imageSprite.alpha, 0.6);
    imageSprite.alpha = Math.max(imageSprite.alpha, 0.3);

    currentState.impFrame += 0.5;
    if (currentState.impFrame > 100) {
      currentState.impFrame = 0;
    }

    if (currentState.time <= 0) {
      const imageScore = image.scoreAgainstTarget((document.getElementsByClassName('upper-canvas')[0]: any));
      const score = imageScoreToGameScore(imageScore);
      const texture = getTextureFromDrawing(fc);
      console.log(imageScore);
      console.log(score);
      gameScore += score;
      const phrase = sayings.getPhrase(gameScore, score);
      console.log(phrase);
      if (!textureMap) {
        return;
      }
      const newID = "completed" + completed;
      completed += 1;
      textureMap[newID] = texture;
      switchState({state: 'Grading',
                   score: score, 
                   texture: newID,
                   phrase,
                   time: 0})
    }
  }

  if (currentState.state === 'Grading') {
    currentState.time += 1/60;
  }

  const tree = showState(currentState);
  vpixi.apply(tree, overlay, textureMap);

  vpixi.apply(showStateBG(currentState), bgStage, textureMap);
  renderer.render(stage);
  bgRenderer.render(bgStage);
  requestAnimationFrame(() => {animate();});
};

pixi.loader.add('spritesheet.json').load((loader, resources) => {
  textureMap = resources['spritesheet.json'].textures;
  checkDoneInit();
});

function checkDoneInit() {
  if (loadedCodebook && fc && textureMap) {
    switchState({state: "Intro"});
    animate();
  }
}

function loadCodebook() {
  const xhr = new XMLHttpRequest();
  xhr.open('get', 'hog-codebook.json', true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (xhr.status === 200) {
        var c = JSON.parse(xhr.responseText).codebook;
        image.setCodebook(c);
        loadedCodebook = true;
        checkDoneInit();
      } else {
        console.error("No codebook found.");
      }
    }
  }
  xhr.send();
};
loadCodebook();

window.addEventListener('load', () => {
  const wrapper = document.getElementById('wrapper');
  wrapper.insertBefore(bgRenderer.view, wrapper.childNodes[0]);
  wrapper.appendChild(renderer.view);

  fc = new global.fabric.Canvas('drawing');
  fc.freeDrawingBrush = new global.fabric.InkBrush(fc);
  fc.freeDrawingBrush.width = 4;
//  fc.freeDrawingCursor = 'none';

  vpixi.updateStyle({
    fontFamily: 'Rock Salt'
  });

  checkDoneInit();
});