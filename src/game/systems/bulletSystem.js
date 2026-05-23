import { world } from "../server/world";
import { chunkKeyWorld } from "./chunkSystem";

export function updateBullets(delta) {
  world.bullets.forEach((bullet) => {
    bullet.x += bullet.velX * (delta / 100);
    bullet.y += bullet.velY * (delta / 100);
    bullet.lifespan -= (delta / 1000) * 25;
    checkBulletCollisions(bullet.id);

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
  for (const element of chunk) {
    if (element.elType == "polygon") {
      const dx = element.x - bullet.x;
      const dy = element.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 20) {
        const damage = (bullet.force > element.hp) ? element.hp : bullet.force; 
        world.polygons.get(element.id).hp -= damage;
        world.polygons.get(element.id).lastHitBy = bullet.parent;
        world.bullets.get(bulletId).force -= damage;
      }
    }
  }
}