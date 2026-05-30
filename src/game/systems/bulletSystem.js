import { world } from "../server/world";
import { getCollisionChunks } from "../utils/functions";
import { chunkKeyWorld } from "./chunkSystem";

export function updateBullets(delta) {
  world.bullets.forEach((bullet) => {
    bullet.x += bullet.velX * (delta / 100);
    bullet.y += bullet.velY * (delta / 100);
    bullet.lifespan -= (delta / 1000) * 25;
    if (bullet.x < 0 || bullet.x > 9600 || bullet.y < 0 || bullet.y > 9600) {
      world.bullets.delete(bullet.id);
      return;
    }

    checkBulletCollisions(bullet.id);
    if (bullet.lifespan <= 0 || bullet.force <= 0 || bullet.hp <= 0) {
      world.bullets.delete(bullet.id);
    } else {
      world.chunks.get(chunkKeyWorld(bullet.x, bullet.y)).add(
        {
          elType: "bullet",
          id: bullet.id,
          x: bullet.x,
          y: bullet.y,
          lifespan: bullet.lifespan,
          parent: bullet.parent,
        }
      );
    }
  });
}

function checkBulletCollisions(bulletId) {
  const bullet = world.bullets.get(bulletId);
  for (const key of getCollisionChunks(bullet.x, bullet.y, 40)) {
    const chunk = world.chunks.get(key);
    if (!chunk) continue;
    for (const element of chunk) {
      if (element.elType == "polygon") {
        const dx = element.x - bullet.x;
        const dy = element.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = element.type === "square" ? 20 : element.type === "triangle" ? 22 : 30;
        if (distance < threshold) {
          const damage = (bullet.force > element.hp) ? element.hp : bullet.force * 0.5;
          world.polygons.get(element.id).hp -= damage;
          world.polygons.get(element.id).lastHitBy = bullet.parent;
          world.bullets.get(bulletId).force -= damage;

          const knockbackStrength = damage * 0.15;
          const knockbackX = knockbackStrength * bullet.velX;
          const knockbackY = knockbackStrength * bullet.velY;
          world.polygons.get(element.id).velX += knockbackX;
          world.polygons.get(element.id).velY += knockbackY;

          const backDamage = element.type === "square" ? 2 : element.type === "triangle" ? 4 : 6;
          bullet.hp -= backDamage * 0.2;
        }
      }
      if (element.elType == "bullet" && element.id != bulletId && element.parent != bullet.parent) {
        const dx = element.x - bullet.x;
        const dy = element.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 15) {
          const damage = bullet.hp - world.bullets.get(element.id).hp;
          console.log(damage)
          if (damage > 0) {
            bullet.hp = damage;
            world.bullets.get(element.id).hp = 0;
          } else {
            bullet.hp = 0;
            world.bullets.get(element.id).hp = damage;
          }
          console.log("F: " + bullet.hp)
        }
      }
      if (element.elType == "player" && element.id !== bullet.parent) {
        const dx = element.x - bullet.x;
        const dy = element.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          const damage = (bullet.force > element.hp) ? element.hp : bullet.force;
          world.players.get(element.id).hp -= damage;
          world.players.get(element.id).lastHitBy = bullet.parent;
          world.bullets.get(bulletId).force -= damage;

          const knockbackStrength = damage * 0.15;
          const knockbackX = knockbackStrength * bullet.velX;
          const knockbackY = knockbackStrength * bullet.velY;
          world.players.get(element.id).velX += knockbackX;
          world.players.get(element.id).velY += knockbackY;
          bullet.hp -= (parseInt(world.players.get(element.id).upLvl[3] || "0") + 5) / 1000;
        }
      }
    }
  }
}