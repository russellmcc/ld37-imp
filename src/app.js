// @flow
// This is my app.

import * as pixi from 'pixi.js';
import * as vpixi from './vpixi.js';

const renderer = new pixi.WebGLRenderer(800, 600);

document.body.appendChild(renderer.view);

const stage = new pixi.Container();

const animate = (textureMap : vpixi.TextureMap) => {
  if (textureMap) {
    vpixi.apply({
      type: 'Container',
      children: [{
        type: 'Container',
        children: [{
          type: 'Sprite',
          texture: 'cat.png',
          x: 0,
          y: 0
        }],
        x: 300,
        y: 300,
      }],
      x: 0,
      y: 0,
    }, stage, textureMap);
  }

  renderer.render(stage);
//  requestAnimationFrame(() => animate(textureMap));
};

pixi.loader.add('spritesheet.json').load((loader, resources) => {
  const textureMap = resources['spritesheet.json'].textures;
  animate(textureMap);
});

