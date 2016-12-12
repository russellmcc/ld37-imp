//@flow

import * as pixi from 'pixi.js';

export type Init = {
  state: 'Init',
};

export type LoadingImage = {
  state: 'LoadingImage',
};

export type Drawing = {
  state: 'Drawing',
  texture: pixi.Texture,
  time: number,
  distance: number,
  impFrame: number,
};

export type ReadyToDraw = {
  state: 'ReadyToDraw',
  texture: pixi.Texture,
};

export type Grading = {
  state: 'Grading',
  score: number,
  texture: string,
  time: 0
};

export type Intro = {
  state: 'Intro'
};

export type State = Init | LoadingImage | Drawing | ReadyToDraw | Grading | Intro;