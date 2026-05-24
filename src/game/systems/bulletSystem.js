import { world } from "../server/world";
import { chunkKeyWorld } from "./chunkSystem";

export function updateBullets(delta) {
  world.bullets.forEach((bullet) => {
    bullet.x += bullet.velX * (delta / 100);
    bullet.y += bullet.velY * (delta / 100);
    bullet.lifespan -= (delta / 1000) * 25;
    checkBulletCollisions(bullet.id);

    if (bullet.x < 0 || bullet.x > 9600 || bullet.y < 0 || bullet.y > 9600) {
      world.bullets.delete(bullet.id);
      return;
    }

    if (bullet.lifespan <= 0 || bullet.force <= 0) {
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
  const chunk = world.chunks.get(chunkKeyWorld(bullet.x, bullet.y));
  if (bullet.x < 0 || bullet.x > 9600 || bullet.y < 0 || bullet.y > 9600) {
    world.bullets.delete(bulletId);
    return;
  }
  for (const element of chunk) {
    if (element.elType == "polygon") {
      const dx = element.x - bullet.x;
      const dy = element.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = element.type === "square" ? 20 : element.type === "triangle" ? 22 : 30;
      if (distance < threshold) {
        const damage = (bullet.force > element.hp) ? element.hp : bullet.force; 
        world.polygons.get(element.id).hp -= damage;
        world.polygons.get(element.id).lastHitBy = bullet.parent;
        world.bullets.get(bulletId).force -= damage;
      }
    }
  }
}