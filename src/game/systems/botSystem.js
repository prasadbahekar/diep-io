import { world } from "../server/world";
import { Input, inputs } from "../utils/input";
import { chunkKeysWithNeighbors } from "./chunkSystem";

const natureBuilds = {
  fighter: [2, 3, 2, 2, 1, 3, 2, 3],
  sniper: [2, 2, 5, 1, 1, 5, 4, 3],
  tank: [4, 5, 2, 1, 3, 2, 3, 4],
  rammer: [3, 4, 3, 5, 2, 2, 5],
};

const upgradeTitles = [
  "Health Regen",
  "Max Health",
  "Bullet Speed",
  "Body Damage",
  "Bullet Penetration",
  "Bullet Damage",
  "Reload Speed",
  "Movement Speed",
];

export function updateBots() {
  for (const bot of world.players.values()) {
    if (!bot.isBot) continue;
    inputs[bot.id] = updateBot(bot.id);
  }
}

function updateBot(botId) {
  const bot = world.players.get(botId);
  if (!bot) return;
  const nearest = nearestObjects(bot.x, bot.y, botId);
  const input = new Input();
  let shoot = false;

  // Upgrades
  if (!bot.nature) {
    const natures = Object.keys(natureBuilds);
    world.players.get(botId).nature =
      natures[Math.floor(Math.random() * natures.length)];
  }

  let upgradeTitle = null;
  if (bot.upgrades > 0) {
    const bestIndex = balancedIncrement(
      natureBuilds[bot.nature],
      bot.upLvl.split("").map(Number),
    );
    upgradeTitle = upgradeTitles[bestIndex];
  }

  console.log(bot.upLvl);

  // State
  let state = "wander";
  if (nearest.player && nearest.player.level > bot.level) {
    state = "playerDodge";
  } else if (nearest.player) {
    state = "playerAttack";
  } else if (nearest.polygon) {
    state = "polygonAttack";
  }

  // Movement
  let moveX = 0;
  let moveY = 0;
  const botHp = bot.hp / bot.maxHp;

  if (nearest.player) {
    const enemy = nearest.player;
    const myHp = bot.hp / bot.maxHp;
    const enemyHp = enemy.hp / enemy.maxHp;
    const myLevel = bot.level;
    const enemyLevel = enemy.level;
    const myPower = myLevel * 0.7 + myHp * 10 * 0.3;
    const enemyPower = enemyLevel * 0.5 + enemyHp * 10 * 0.3;

    const confidence = myPower - enemyPower;
    const dx = nearest.playerDx;
    const dy = nearest.playerDy;
    const dist = nearest.playerDistance;

    if (confidence < -1) {
      const force = 500 / dist;
      moveX -= dx * force;
      moveY -= dy * force;
    } else if (confidence < 1) {
      const force = (dist - 250) / 250;
      moveX += dx * force * 0.4;
      moveY += dy * force * 0.4;
      moveX += -dy * 0.6;
      moveY += dx * 0.6;
    } else {
      const force = (dist - 150) / 100;
      moveX += dx * force * 1.2;
      moveY += dy * force * 1.2;
      moveX += -dy * 0.25;
      moveY += dx * 0.25;
    }
  }

  if (nearest.polygon && nearest.polygonDistance > 125) {
    const dx = nearest.polygonDx;
    const dy = nearest.polygonDy;
    const dist = nearest.polygonDistance;
    const force = (dist - 100) / 150;
    moveX += dx * force;
    moveY += dy * force;
  }

  if (nearest.bullet) {
    const bullet = nearest.bullet;
    const bulletObj = world.bullets.get(bullet.id);
    const bullVelX = bulletObj.velX;
    const bullVelY = bulletObj.velY;
    const bulletSpeed = Math.hypot(bullVelX, bullVelY);
    if (bulletSpeed > 0.001) {
      const toBotX = bot.x - bullet.x;
      const toBotY = bot.y - bullet.y;
      const dist = Math.hypot(toBotX, toBotY);
      const dirToBotX = toBotX / dist;
      const dirToBotY = toBotY / dist;
      const bulletDirX = bullVelX / bulletSpeed;
      const bulletDirY = bullVelY / bulletSpeed;
      const dot = dirToBotX * bulletDirX + dirToBotY * bulletDirY;
      const timeToImpact = dist / bulletSpeed;
      if (dot > 0.5 && timeToImpact < 35) {
        let perpX = -bulletDirY;
        let perpY = bulletDirX;
        const perpDot = perpX * dirToBotX + perpY * dirToBotY;

        if (perpDot < 0) {
          perpX = -perpX;
          perpY = -perpY;
        }

        let force = (1 / Math.max(timeToImpact, 1)) * dot * 60;
        force = Math.min(force, 4);
        moveX += perpX * force;
        moveY += perpY * force;
        moveX += dirToBotX * force * 0.2;
        moveY += dirToBotY * force * 0.2;
      }
    }
  }

  if (state === "wander") {
    const player = world.players.get(botId);
    if (!player.wander) {
      player.wander = {
        angle: Math.random() * Math.PI * 2,
        timer: 0,
        target: null,
      };
    }

    const wander = player.wander;
    wander.timer--;
    if (wander.timer <= 0 || !wander.target) {
      wander.angle += (Math.random() - 0.5) * 1.1;
      const distance = 300 + Math.random() * 400;
      const tx = bot.x + Math.cos(wander.angle) * distance;
      const ty = bot.y + Math.sin(wander.angle) * distance;
      wander.target = {
        x: Math.max(0, Math.min(9599, tx)),
        y: Math.max(0, Math.min(9599, ty)),
      };
      wander.timer = 120 + Math.random() * 180;
    }

    const dx = wander.target.x - bot.x;
    const dy = wander.target.y - bot.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 50) {
      wander.target = null;
    } else {
      const speed = 0.6;
      moveX += (dx / dist) * speed;
      moveY += (dy / dist) * speed;
    }
  } else world.players.get(botId).wander = null;

  if (bot.x < 750 || bot.x > 9600 - 750 || bot.y < 750 || bot.y > 9600 - 750) {
    const dx = 4800 - bot.x;
    const dy = 4800 - bot.y;
    const dist = Math.hypot(dx, dy);

    moveX += (dx / dist) * 2;
    moveY += (dy / dist) * 2;
  }

  // Rondomize, Normalize & Cap
  moveX += (Math.random() - 0.5) * 0.1;
  moveY += (Math.random() - 0.5) * 0.1;
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
    aimY = nearest.playerDy + world.players.get(nearest.player.id).velY / 1.5;
    shoot = true;
  }

  if (state == "polygonAttack") {
    aimX =
      nearest.polygonDx + world.polygons.get(nearest.polygon.id).velX * 0.3;
    aimY =
      nearest.polygonDy + world.polygons.get(nearest.polygon.id).velY * 0.3;
    shoot = true;
  }

  // Finalize
  input.shoot = shoot;
  input.moveX = moveX;
  input.moveY = moveY;
  input.mouseX = aimX * 100 + bot.x;
  input.mouseY = aimY * 100 + bot.y;
  input.upgrade = upgradeTitle;
  return input;
}

function distanceIntensity(d) {
  return d / (1 + Math.abs(d));
}

function inverseDistanceIntensity(d) {
  return (d * Math.abs(d)) / (1 + d * d);
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
    polygon,
    polygonDistance,
    polygonDx,
    polygonDy,
    bullet,
    bulletDistance,
    bulletDx,
    bulletDy,
    player,
    playerDistance,
    playerDx,
    playerDy,
  };
}

function balancedIncrement(targetRatio, actualValues) {
  const totalTarget = targetRatio.reduce((a, b) => a + b, 0);

  const totalActual = actualValues.reduce((a, b) => a + b, 0);

  let bestIndex = -1;
  let biggestDeficit = -Infinity;

  for (let i = 0; i < targetRatio.length; i++) {
    if (targetRatio[i] <= 0) continue;

    const expected = totalActual * (targetRatio[i] / totalTarget);

    const deficit = expected - actualValues[i];

    if (deficit > biggestDeficit) {
      biggestDeficit = deficit;
      bestIndex = i;
    }
  }

  if (bestIndex !== -1) {
    actualValues[bestIndex]++;
  }

  return bestIndex;
}
