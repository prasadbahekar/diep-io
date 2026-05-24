import { getLevelFromScore } from "../data/levels";
import { world } from "../server/world";
import { state } from "../state";
import { input } from "../utils/input";
import Phaser, { Time } from "phaser";

export function initializePlayer(renderDistance) {
  const player = {
    x: world.properties.worldSize / 2,
    y: world.properties.worldSize / 2,
    rotation: 0,
    velX: 0,
    velY: 0,
    maxVel: 180,
    lastShoot: 0,
    level: 1,
    score: 0,
    renderDistance: renderDistance,
    id: crypto.randomUUID(),
  };

  world.players.set(player.id, player);
  player.x = world.properties.worldSize / 2;
  player.y = world.properties.worldSize / 2;
  return player.id;
}

export function updatePlayers(delta) {
  world.players.forEach((player) => {
    playerMovement(player, delta);
    playerRotation(player, delta);
    playerShoot(player);
    playerMetrics(player);
  });
}

function playerRotation(player, delta) {
  if (input.isAutoRotate) {
    player.rotation += 1 * delta / 1000;
  } else {
    // const target = Phaser.Math.Angle.Between(
    //   player.x,
    //   player.y,
    //   input.mouseX,
    //   input.mouseY,
    // );

    // const diff = Phaser.Math.Angle.Wrap(target - player.rotation);
    // const value = player.rotation + diff * 0.9999 * delta / 100;
    // player.rotation = Number.isFinite(value) ? value : player.rotation;
    player.rotation = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      input.mouseX,
      input.mouseY,
    );
  }
}

function playerMovement(player, delta) {
  const accel = 6;
  const friction = 0.95;

  let inputX = 0;
  let inputY = 0;

  // Input
  if (input.left) inputX -= 1;
  if (input.right) inputX += 1;
  if (input.up) inputY -= 1;
  if (input.down) inputY += 1;

  // Normalize Input
  const length = Math.sqrt(inputX * inputX + inputY * inputY);
  if (length > 0) {
    inputX /= length;
    inputY /= length;
  }

  // Accelaration and Friction
  player.velX += inputX * accel;
  player.velY += inputY * accel;

  if (inputX === 0) player.velX *= friction;
  if (inputY === 0) player.velY *= friction;

  // Cap
  player.velX = Phaser.Math.Clamp(player.velX, -player.maxVel, player.maxVel);
  player.velY = Phaser.Math.Clamp(player.velY, -player.maxVel, player.maxVel);

  if (Math.abs(player.velX) < 0.01) player.velX = 0;
  if (Math.abs(player.velY) < 0.01) player.velY = 0;

  player.x += (player.velX * delta) / 1000;
  player.y += (player.velY * delta) / 1000;

  player.x = Phaser.Math.Clamp(player.x, 0, world.properties.worldSize);
  player.y = Phaser.Math.Clamp(player.y, 0, world.properties.worldSize);
}

function playerMetrics(player) {
  player.level = getLevelFromScore(player.score);
}

function playerShoot(player) {
  const now = Date.now();
  if (input.shoot && now - player.lastShoot >= 1000) {
    player.isShooting = true;
    player.lastShoot = now;

    const angle = player.rotation;
    const velX = Math.cos(angle) * 20 + player.velX * 0.03;
    const velY = Math.sin(angle) * 20 + player.velY * 0.03;
    const bulletX = player.x + Math.cos(angle) * 24;
    const bulletY = player.y + Math.sin(angle) * 24;

    const bulletId = crypto.randomUUID();
    world.bullets.set(bulletId, {
      parent: player.id,
      id: bulletId,
      lifespan: 100,
      x: bulletX,
      y: bulletY,
      velX: velX,
      velY: velY,
      force: 1,
    });

    const recoilForce = 10;
    player.velX -= Math.cos(player.rotation) * recoilForce;
    player.velY -= Math.sin(player.rotation) * recoilForce;
  }

  if (player.isShooting) {
    const elapsed = now - player.lastShoot;
    if (elapsed >= 1000 / 1.05) player.isShooting = false;
  }
}
