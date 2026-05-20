import { world } from "../server/world";

export function updatePolygons(delta) {
  world.polygons.forEach((polygon) => {
    polygon.x += (polygon.velX * delta) / 1000;
    polygon.y += (polygon.velY * delta) / 1000;
    polygon.rotation += (1 * delta) / 1000;
  });
}
