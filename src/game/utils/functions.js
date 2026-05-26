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

export function getCollisionChunks(x, y, radius) {
  const CHUNK_SIZE = 128;
  const chunkX = Math.floor(x / CHUNK_SIZE);
  const chunkY = Math.floor(y / CHUNK_SIZE);

  const localX = x % CHUNK_SIZE;
  const localY = y % CHUNK_SIZE;

  const chunks = [];

  // always include current chunk
  chunks.push(`${chunkX},${chunkY}`);

  const nearLeft = localX < radius;
  const nearRight = localX > CHUNK_SIZE - radius;
  const nearTop = localY < radius;
  const nearBottom = localY > CHUNK_SIZE - radius;

  // horizontal neighbors
  if (nearLeft) {
    chunks.push(`${chunkX - 1},${chunkY}`);
  }

  if (nearRight) {
    chunks.push(`${chunkX + 1},${chunkY}`);
  }

  // vertical neighbors
  if (nearTop) {
    chunks.push(`${chunkX},${chunkY - 1}`);
  }

  if (nearBottom) {
    chunks.push(`${chunkX},${chunkY + 1}`);
  }

  // diagonal neighbors
  if (nearLeft && nearTop) {
    chunks.push(`${chunkX - 1},${chunkY - 1}`);
  }

  if (nearRight && nearTop) {
    chunks.push(`${chunkX + 1},${chunkY - 1}`);
  }

  if (nearLeft && nearBottom) {
    chunks.push(`${chunkX - 1},${chunkY + 1}`);
  }

  if (nearRight && nearBottom) {
    chunks.push(`${chunkX + 1},${chunkY + 1}`);
  }

  return chunks;
}