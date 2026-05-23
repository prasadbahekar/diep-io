import { world } from "../server/world";
import { chunkKeyWorld } from "./chunkSystem";

export function updateBullets(delta) {
  world.bullets.forEach((bullet) => {
    bullet.x += bullet.velX * (delta / 100);
    bullet.y += bullet.velY * (delta / 100);
    bullet.lifespan -= (delta / 1000) * 25;
    if (bullet.lifespan <= 0) {
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
