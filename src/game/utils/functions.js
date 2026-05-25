import { state } from "../state";

export function enterFullscreen() {
  if (state.game.onGamepad) return;
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    // Safari
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    // old Edge
    return elem.msRequestFullscreen();
  }
}

export function getRandomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getGamepadControls() {
  const gamepads = navigator.getGamepads();
  for (const gp of gamepads) {
    if (!gp) continue;
    return gp;
  }
  state.game.onGamepad = false;
}