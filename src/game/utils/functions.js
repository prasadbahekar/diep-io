import { state } from "../state";

export function enterFullscreen() {
  if (state.game.onGamepad) return;
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen();
  }
}

export function formatDuration(start, end) {
  const diffMs = Math.abs(end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
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

  chunks.push(`${chunkX},${chunkY}`);

  const nearLeft = localX < radius;
  const nearRight = localX > CHUNK_SIZE - radius;
  const nearTop = localY < radius;
  const nearBottom = localY > CHUNK_SIZE - radius;

  if (nearLeft) chunks.push(`${chunkX - 1},${chunkY}`);
  if (nearRight) chunks.push(`${chunkX + 1},${chunkY}`);
  if (nearTop) chunks.push(`${chunkX},${chunkY - 1}`);
  if (nearBottom) chunks.push(`${chunkX},${chunkY + 1}`);
  if (nearLeft && nearTop) chunks.push(`${chunkX - 1},${chunkY - 1}`);
  if (nearRight && nearTop) chunks.push(`${chunkX + 1},${chunkY - 1}`);
  if (nearLeft && nearBottom) chunks.push(`${chunkX - 1},${chunkY + 1}`);
  if (nearRight && nearBottom) chunks.push(`${chunkX + 1},${chunkY + 1}`);

  return chunks;
}

export function simplifyFloats(value, detail = 2) {
  const detailMultiplier = 10 ^ detail;
  return Math.round(value * detailMultiplier) / detailMultiplier;
}
