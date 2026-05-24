import { polygons } from "../data/polygons";
import { world } from "../server/world";
import { getRandomInt } from "../utils/functions";
import { chunkKeyWorld } from "./chunkSystem";

export function createPolygon(x, y, type) {
  const polyId = crypto.randomUUID();
  world.polygons.set(polyId, {
    id: polyId,
    x: x,
    y: y,
    velX: getRandomInt(-12, 12),
    velY: getRandomInt(-12, 12),
    hp: polygons[type].hp,
    rotation: 0,
    type: type,
  });
}

export function updatePolygons(delta) {
  world.polygons.forEach((polygon) => {
    polygon.x += (polygon.velX * delta) / 1000;
    polygon.y += (polygon.velY * delta) / 1000;
    polygon.rotation += (1 * delta) / 1000;

    if (polygon.x < 0 || polygon.x > 9600 || polygon.y < 0 || polygon.y > 9600) {
      world.polygons.delete(polygon.id);
      return;
    }

    // Cap velocity to 12
    polygon.velX = Math.max(-12, Math.min(12, polygon.velX));
    polygon.velY = Math.max(-12, Math.min(12, polygon.velY));

    if (polygon.hp <= 0) {
      if (polygon.lastHitBy) {
        const player = world.players.get(polygon.lastHitBy);
        if (player) {
          player.score += polygons[polygon.type].xp;
        }
      }
      world.polygons.delete(polygon.id);
    } else {
      world.chunks.get(chunkKeyWorld(polygon.x, polygon.y)).add(
        {
          elType: "polygon",
          id: polygon.id,
          x: polygon.x,
          y: polygon.y,
          rotation: polygon.rotation,
          type: polygon.type,
          hp: polygon.hp,
        }
      );
    }
  });
}
