import { polygons } from "../data/polygons";
import { world } from "../server/world";
import { chunkKeyWorld } from "./chunkSystem";

export function createPolygon(x, y, type) {
  const polyId = crypto.randomUUID();
  world.polygons.set(polyId, {
    id: polyId,
    x: x,
    y: y,
    velX: 8,
    velY: 8,
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
