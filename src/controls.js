// @flow
// This is my controls.

const buttons = {
  up: 0,
  down: 1,
  left: 2,
  right: 3
};

export type Button = $Keys<typeof buttons>;

export type State = Map<Button, bool>;

const state : Map<Button, bool> = new Map();
for (let button of Object.keys(buttons)) {
  state.set(button, false);
}


export const getState = (): State => {
  return state;
};

const keyToButtonMap : Map<number, Button> = new Map([
  [37, 'left'],
  [38, 'up'],
  [39, 'right'],
  [40, 'down']
]);

const keyToButton = (key: number): ?Button => {
  return keyToButtonMap.get(key);
};

export const init = (item: any) => {
  const set = (event: any, v: bool) => {
    const b = keyToButton(event.which || event.keyCode);
    if (b) {
      state.set(b, v);
    }
    event.stopPropagation();
    event.preventDefault();
  };

  const keydown = (event: any) => {
    set(event, true);
  };
  item.addEventListener('keydown', keydown, true);
  const keyup = (event: any) => {
    set(event, false);
  };
  item.addEventListener('keyup', keyup, true);
};
