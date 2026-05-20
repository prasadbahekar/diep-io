import { updateBullets } from "../systems/bulletSystem";
import { updatePlayers, initializePlayer } from "../systems/playerSystem";
import { updatePolygons } from "../systems/polygonSystem";
import { packet } from "./packet";
import { world } from "./world";

export function joinPlayer() {
  const polyId = crypto.randomUUID();
  world.polygons.set(polyId, {
    id: polyId,
    x: 4700,
    y: 4700,
    velX: 8,
    velY: 8,
    hp: 0,
    rotation: 0,
    type: "square",
  });

  console.log(world.polygons.get(polyId));
  return initializePlayer();
}

export function updateServer(delta) {
  updatePlayers(delta);
  updateBullets(delta);
  updatePolygons(delta);
  createPacket();
}

function createPacket() {
  world.players.forEach((player) => {
    packet.player = {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
      level: player.level,
      score: player.score,
      lastShoot: player.lastShoot,
      now: Date.now(),
    };
  });

  packet.bullets = [];
  world.bullets.forEach((bullet) => {
    packet.bullets.push({
      x: bullet.x,
      y: bullet.y,
      lifespan: bullet.lifespan,
      parent: bullet.parent,
      id: bullet.id,
    });
  });

  packet.polygons = [];
  world.polygons.forEach((polygon) => {
    console.log(polygon);
    packet.polygons.push({
      id: polygon.id,
      x: polygon.x,
      y: polygon.y,
      rotation: polygon.rotation,
      type: polygon.type,
    });
  });
}
