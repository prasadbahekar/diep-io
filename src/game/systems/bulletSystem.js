import { world } from "../server/world";

export function updateBullets(delta) {
  world.bullets.forEach((bullet) => {
    bullet.x += bullet.velX * (delta / 100);
    bullet.y += bullet.velY * (delta / 100);
    bullet.lifespan -= (delta / 1000) * 25;
    if (bullet.lifespan <= 0) {
      world.bullets.delete(bullet.id);
    }
  });
}
