// @flow

import * as pixi from 'pixi.js';

export type Sprite = {
  type: 'Sprite',
  x: number,
  y: number,
  texture: string,
};

export type Container = {
  type: 'Container',
  children: Array<Sprite | Container>,
  x: number,
  y: number,
};

export type TextureMap = {[id:string]: pixi.Texture};

export const apply = (container : Container,
                      pixiRoot : pixi.Container,
                      textureMap : TextureMap) => {
  pixiRoot.x = container.x;
  pixiRoot.y = container.y;

  const targetLength = container.children.length;
  const currentLength = pixiRoot.children.length;

  type VPIXIType = "Container" | "Sprite" | "Other";
  const getTargetType = (target : Sprite | Container) : VPIXIType => {
    return target.type;
  };

  const getCurrentType = (current : pixi.DisplayObject) : VPIXIType => {
    if (current instanceof pixi.Sprite) {
      return 'Sprite';
    } else if (current instanceof pixi.Container) {
      return 'Container';
    } else {
      return 'Other';
    }
  };

  const applySprite = (target : Sprite, sprite : pixi.Sprite) => {
    sprite.x = target.x;
    sprite.y = target.y;
    sprite.texture = textureMap[target.texture];
  };

  const createNewObject = (target : Sprite | Container) : pixi.DisplayObject => {
    const t = getTargetType(target);
    if (target.type === 'Container') {
      let ret = new pixi.Container();
      apply(target, ret, textureMap);
      return ret;
    } else {
      let ret = new pixi.Sprite();
      applySprite(target, ret);
      return ret;
    }
  };


  // First, handle any overlap.
  const overlap = Math.min(targetLength, currentLength);

  for (let i = 0; i < overlap; i++) {
    if (getTargetType(container.children[i]) == getCurrentType(pixiRoot.children[i])) {
      if (container.children[i].type === 'Container') {
        apply(container.children[i], pixiRoot.children[i], textureMap);
      } else {
        applySprite(container.children[i], pixiRoot.children[i]);
      }
    } else {
      pixiRoot.removeChildAt(i);
      pixiRoot.addChildAt(i, createNewObject(container.children[i]));
    }
  }

  // Handle any excess elements in target.
  for (let i = overlap; i < targetLength; ++i) {
    pixiRoot.addChild(createNewObject(container.children[i]));
  }

  // Handle any excess elements in current tree.
  if (currentLength > overlap) {
    pixiRoot.removeChildren(overlap);
  }
};