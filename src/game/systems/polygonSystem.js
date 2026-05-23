import { world } from "../server/world";
import { chunkKeyWorld } from "./chunkSystem";

export function updatePolygons(delta) {
  world.polygons.forEach((polygon) => {
    polygon.x += (polygon.velX * delta) / 1000;
    polygon.y += (polygon.velY * delta) / 1000;
    polygon.rotation += (1 * delta) / 1000;
    
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
  });
}
