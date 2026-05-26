import { getLevelFromScore } from "../data/levels";
import { regenHP } from "../data/upgrades";
import { world } from "../server/world";
import Phaser, { Time } from "phaser";
import { chunkKeyWorld } from "./chunkSystem";
import { inputs } from "../utils/input";``

export function initializePlayer(renderDistance) {
  const player = {
    x: world.properties.worldSize / 2,
    y: world.properties.worldSize / 2,
    rotation: 0,
    velX: 0,
    velY: 0,
    maxVel: 180,
    maxHp: 50,
    hp: 50, 
    lastShoot: 0,
    score: 0,
    level: 1,
    upgrades: 0,
    upLvl: "00000000",
    damage: 7,
    reload: 0.6,
    bulletSpeed: 20,
    renderDistance: renderDistance,
    id: crypto.randomUUID(),
  };

  world.players.set(player.id, player);
  player.x = Math.random() * (5100 - 4500) + 4500;
  player.y = Math.random() * (5100 - 4500) + 4500;
  return player.id;
}

export function updatePlayers(delta) {
  world.players.forEach((player) => {
    playerMovement(player, delta);
    playerRotation(player, delta);
    playerShoot(player);
    playerCollisions(player, delta);
    playerMetrics(player, delta);
    updateUpgrades(player, delta);
    playerChunkUpdate(player);
  });
}

function playerChunkUpdate(player) {
  world.chunks.get(chunkKeyWorld(player.x, player.y)).add(
    {
      elType: "player",
      x: player.x,
      y: player.y,
      type: "basic",
      hp: player.hp,
      maxHp: player.maxHp,
      rotation: player.rotation,
      id: player.id,
      level: player.level,
    }
  )
}

function playerRotation(player, delta) {
  const input = inputs[player.id];
  if (input.isAutoRotate) {
    player.rotation += 1 * delta / 1000;
  } else {
    player.rotation = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      input.mouseX,
      input.mouseY,
    );
  }
}


function playerMovement(player, delta) {
  const input = inputs[player.id];
  const accel = 6;
  const friction = 0.95;

  let inputX = input.moveX;
  let inputY = input.moveY;

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

function playerMetrics(player, delta, updateStats = false) {
  // Health Regen
  player.hp += regenHP[parseInt(player.upLvl[0] || "0")] * player.maxHp * (delta / 1000);
  if (player.hp > player.maxHp) player.hp = player.maxHp;

  if (getLevelFromScore(player.score) > player.level) {
    player.upgrades += getLevelFromScore(player.score) - player.level;
    player.level = getLevelFromScore(player.score);
  }

  if (updateStats || getLevelFromScore(player.score) > player.level) {
    // Max Health
    const hpRatio = player.hp / player.maxHp;
    const maxHealthLvl = parseInt(player.upLvl[1] || "0");
    const baseHealth = 50 + (2 * (player.level - 1))
    const bonusHealth = maxHealthLvl * 20;
    player.maxHp = baseHealth + bonusHealth;
    player.hp = hpRatio * player.maxHp;

    // Movement Speed
    const moveSpeedLvl = parseInt(player.upLvl[7] || "0");
    player.maxVel = 175 + (moveSpeedLvl * 18) - (player.level * 3);

    // Bullet Speed
    const bulletSpeedLvl = parseInt(player.upLvl[2] || "0");
    player.bulletSpeed = 20 + (bulletSpeedLvl * 2);
  } 

  if (updateStats) {
    // Bullet Damage
    const bulletDmgLvl = parseInt(player.upLvl[5] || "0");
    player.damage = 7 + (bulletDmgLvl * 3);

    // Reload Speed
    const reloadLvl = parseInt(player.upLvl[6] || "0");
    player.reload = 0.6 - (reloadLvl * 0.04);
  }
}

function playerCollisions(player, delta) {
  const chunk = world.chunks.get(chunkKeyWorld(player.x, player.y));
  for (const element of chunk) {
    if (element.elType == "polygon") {
      const dx = element.x - player.x;
      const dy = element.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = element.type === "square" ? 50 : element.type === "triangle" ? 50 : 75;
      if (distance < threshold+3) {
        player.velX -= dx * 0.25;
        player.velY -= dy * 0.25;
      }
      if (distance < threshold) {
        const damage = (parseInt(player.upLvl[3] || "0") + 5) * 4 * (delta / 300);
        world.polygons.get(element.id).hp -= damage;
        world.polygons.get(element.id).lastHitBy = player.id;
        const backDamage = element.type === "square" ? 8 : element.type === "triangle" ? 16 : 24;
        player.hp -= backDamage * (delta / 300);
        world.polygons.get(element.id).velX += dx * 0.15;
        world.polygons.get(element.id).velY += dy * 0.15;
      }
    } else if (element.elType == "player" && element.id !== player.id) {
      const dx = element.x - player.x;
      const dy = element.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 60) {
        player.velX -= dx * 0.1;
        player.velY -= dy * 0.1;
        const damage = (parseInt(player.upLvl[3] || "0") + 5) * 6 * (delta / 1000);
        world.players.get(element.id).hp -= damage;
        world.players.get(element.id).lastHitBy = player.id;
        player.hp -= (parseInt(world.players.get(element.id).upLvl[3] || "0") + 5) * 6 * (delta / 1000);
        world.players.get(element.id).velX += dx * 0.1;
        world.players.get(element.id).velY += dy * 0.1;
      }
    }
  }
}

function updateUpgrades(player, delta) {
  if (player.upgrades <= 0) return;

  const input = inputs[player.id];
  const upgradeIndexMap = {
    "Health Regen": 0,
    "Max Health": 1,
    "Bullet Speed": 2,
    "Body Damage": 3,
    "Bullet Penetration": 4,
    "Bullet Damage": 5,
    "Reload Speed": 6,
    "Movement Speed": 7,
  };

  const index = upgradeIndexMap[input.upgrade];

  if (index === undefined) return;
  if (!player.upLvl) {
    player.upLvl = "00000000";
  }
  const levels = player.upLvl.split("");
  let currentLevel = parseInt(levels[index]);
  if (currentLevel >= 7) return;
  currentLevel += 1;
  levels[index] = currentLevel.toString();
  player.upLvl = levels.join("");
  player.upgrades -= 1;
  playerMetrics(player, delta, true);
}

function playerShoot(player) {
  const now = Date.now();
  const input = inputs[player.id];
  if (input.shoot && now - player.lastShoot >= player.reload * 1000) {
    player.isShooting = true;
    player.lastShoot = now;

    const angle = player.rotation;
    const velX = Math.cos(angle) * player.bulletSpeed + player.velX * 0.03;
    const velY = Math.sin(angle) * player.bulletSpeed + player.velY * 0.03;
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
      hp: 2 + (1.5 * parseInt(player.upLvl[4] || "0")),
      force: player.damage,
    });

    const recoilForce = 10;
    player.velX -= Math.cos(player.rotation) * recoilForce;
    player.velY -= Math.sin(player.rotation) * recoilForce;
  }

  if (player.isShooting) {
    const elapsed = now - player.lastShoot;
    if (elapsed >= player.reload * 1000 / 1.05) player.isShooting = false;
  }
}
