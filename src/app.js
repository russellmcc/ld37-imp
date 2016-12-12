// @flow

import * as pixi from 'pixi.js';
import * as image from './image.js';
import * as state from './state.js';
import * as vpixi from './vpixi.js';

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
let scrapbook: Array<string>= [];
let completed = 0;

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
const INK_TOP = 50;
const INK_BOTTOM = 150;
const INK_WIDTH = 50;

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
}

function loadRandomImage() {
    const imageInd = Math.floor(Math.random() * NUM_IMAGES) + 1;
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
    switchState({state:'Drawing', texture:currentState.texture, time:10, distance: 0, impFrame: 0});
  }
  if (currentState.state === 'Grading' && currentState.time > GRADING_SCROLL_TIME + GRADING_TWIRL_TIME) {
    loadRandomImage();
  }
  if (currentState.state === 'Intro') {
    loadRandomImage();
  }
  if (currentState.state === 'Drawing') {
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

  ctx.fillStyle = "white"; 
  ctx.fillRect(0,0, tCanvas.width, tCanvas.height);
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
  upperCanvas.hidden = !isDrawing;
  imageSprite.visible = isDrawing;

  if (newState.state === 'Drawing') {
    fc.clear();
    fc.freeDrawingBrush.distanceTraveled = 0;
    imageSprite.texture = newState.texture;
    imageSprite.width = 540;
    imageSprite.height = 540 / newState.texture.width * newState.texture.height;
    console.log(imageSprite.height);
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
    }],};
  }
  return {
    type: 'Container',
    x: 0,
    y: 0,
    children: [],
  };
};

function showState(s : state.State): vpixi.Container {
  if (s.state === 'LoadingImage') {
    return {
      type: 'Container',
      x: 0,
      y: 0,
      children: [{
        type: 'Text',
        x: 200,
        y: 200,
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
        text:"Moorcock is ready for you to draw a photo!\nYou\'ll have only 30 seconds to draw,\nso there's no time to delay!\nIf you run out of ink, refill by\n clicking on the inkbrush on the left of your room.\nRemember, these are special memories\nof the evil warlock's vacation,\nand he doesn't like being disappointed!\n Click Anywhere to continue."
      }]}
  } else if (s.state === 'Drawing') {
    const impStr = "imp_small_" + padDigits(Math.floor(s.impFrame), 5) + ".png"; 
    const children = [{
        type: 'Text',
        x:0,
        y:0,
        text: Math.ceil(s.time).toString()
      }, {
        type: 'Sprite',
        x:mouseX - 50,
        y:mouseY,
        rotation: 0,
        width: 100,
        height: 50,
        texture: impStr,
      }];
    if (s.distance > .75 * INK_DISTANCE_MAX) {
      children.push({
        type: 'Text',
        x: 0,
        y: 200,
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
      const twirlX = 200 + 200 * subTime;
      const twirlY = 200;
      const twirlRot = 2 + 13 * subTime;
      let children = [
        {
          type: 'Sprite',
          x: twirlX,
          y: twirlY,
          texture: 'white.png',
          rotation: twirlRot,
          width: 150,
          height: 100,
        },        {
          type: 'Sprite',
          x: twirlX,
          y: twirlY,
          texture: s.texture,
          rotation: twirlRot,
          width: 150,
          height: 100,
        }];
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
        text:"Oh No!  You've run afoul\nof the evil warlock Moorcock!\nHe's turned you into an imp\nand has forced you to live in his camera.\nYour fate from here to eternity is to\ncapture his vacation images in ink."
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
      const score = image.scoreAgainstTarget((document.getElementsByClassName('upper-canvas')[0]: any))
      const texture = getTextureFromDrawing(fc);
      console.log(score);
      if (!textureMap) {
        return;
      }
      const newID = "completed" + completed;
      completed += 1;
      textureMap[newID] = texture;
      scrapbook.push(newID);
      switchState({state: 'Grading',
                   score: score, texture: newID,
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

  checkDoneInit();
});