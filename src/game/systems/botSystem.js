import { world } from "../server/world";
import { Input } from "../utils/input";
import { chunkKeysWithNeighbors } from "./chunkSystem";

export function updateBot(botId) {
  const bot = world.players.get(botId);
  const nearest = nearestObjects(bot.x, bot.y, botId);
  const input = new Input();
  let shoot = false;

  // State
  let state = "idle"
  if (nearest.bulletDistance < 200) {
    state = "bulletDodge"
  } else if (nearest.player && nearest.player.level > bot.level) {
    state = "playerDodge"
  } else if (nearest.player) {
    state = "playerAttack";
  } else if (nearest.polygon) {
    state = "polygonAttack";
  }

  // Movement
  let moveX = 0;
  let moveY = 0;

  if (state == "bulletDodge") {
    moveX = -nearest.bulletDx;
    moveY = -nearest.bulletDy;
  } else if (state == "playerDodge") {
    moveX = -nearest.playerDx;
    moveY = -nearest.playerDy;
  } else if (state == "playerAttack" && nearest.playerDistance > 175) { 
    moveX = nearest.playerDx;
    moveY = nearest.playerDy;
  } else if (state == "polygonAttack" && nearest.polygonDistance > 125) {
    moveX = nearest.polygonDx;
    moveY = nearest.polygonDy;
  } else if (state == "idle") {
    moveX = 0;
    moveY = 0;
  }

  console.log(state)
  // Normalize & Cap
  moveX = Math.max(-1, Math.min(1, moveX));
  moveY = Math.max(-1, Math.min(1, moveY));
  const length = Math.hypot(moveX, moveY);
  if (length > 0) {
    moveX /= length;
    moveY /= length;
  }

  // Aim
  let aimX = 0;
  let aimY = 0;

  if (state == "playerAttack" || state == "playerDodge") { 
    aimX = nearest.playerDx + world.players.get(nearest.player.id).velX / 1.5;
    aimY = nearest.playerDy + world.players.get(nearest.player.id).velX / 1.5;
    shoot = true;
  } else if (state == "polygonAttack") {
    aimX = nearest.polygonDx + world.polygons.get(nearest.polygon.id).velX / 1.5;
    aimY = nearest.polygonDy + world.polygons.get(nearest.polygon.id).velY / 1.5;
    shoot = true;
  }

  // Finalize
  input.shoot = shoot;
  input.moveX = moveX;
  input.moveY = moveY;
  input.mouseX = aimX * 100 + bot.x;
  input.mouseY = aimY * 100 + bot.y;
  return input;
}

function nearestObjects(x, y, parent) {
  let polygon = null;
  let polygonDistance = Infinity;
  let polygonDx = 0;
  let polygonDy = 0;
  let player = null;
  let playerDistance = Infinity;
  let playerDx = 0;
  let playerDy = 0;
  let bullet = null;
  let bulletDistance = Infinity;
  let bulletDx = 0;
  let bulletDy = 0;

  const chunks = chunkKeysWithNeighbors(x, y);
  for (const key of chunks) {
    const chunk = world.chunks.get(key);
    if (!chunk) continue;
    for (const element of chunk) {
      if (element.elType == "polygon") {
        const dx = element.x - x;
        const dy = element.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < polygonDistance) {
          polygonDistance = distance;
          polygon = element;
          polygonDx = dx;
          polygonDy = dy;
        }
      }
      if (element.elType == "bullet" && element.parent != parent) {
        const dx = element.x - x;
        const dy = element.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bulletDistance) {
          bulletDistance = distance;
          bullet = element;
          bulletDx = dx;
          bulletDy = dy;
        }
      }
      if (element.elType == "player" && element.id != parent) {
        const dx = element.x - x;
        const dy = element.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < playerDistance) {
          playerDistance = distance;
          player = element;
          playerDx = dx;
          playerDy = dy;
        }
      }
    }
  }

  return {
    polygon, polygonDistance, polygonDx, polygonDy,
    bullet, bulletDistance, bulletDx, bulletDy,
    player, playerDistance, playerDx, playerDy,
  };
}