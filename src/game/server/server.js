import { updateBullets } from "../systems/bulletSystem";
import { updatePlayers, initializePlayer } from "../systems/playerSystem";
import { updatePolygons } from "../systems/polygonSystem";
import { chunkKey, chunkKeyWorld, initializeChunks, updateChunks } from "../systems/chunkSystem";
import { packet } from "./packet";
import { world } from "./world";

export function joinPlayer(renderDistance) {
  const polyId = crypto.randomUUID();
  world.polygons.set(polyId, {
    id: polyId,
    x: 4700,
    y: 4700,
    velX: 8,
    velY: 8,
    hp: 100,
    rotation: 0,
    type: "triangle",
  });
  return initializePlayer(renderDistance);
}

export function updateServer(delta) {
  initializeChunks();
  updatePlayers(delta);
  updateBullets(delta);
  updatePolygons(delta);
  createPacket();

  const nonEmptyChunks = [...world.chunks.entries()].filter(([key, set]) => set.size > 0);
}

function createPacket() {
  world.players.forEach((player) => {
    packet.bullets = [];
    packet.polygons = [];
    packet.player = {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
      level: player.level,
      score: player.score,
      lastShoot: player.lastShoot,
      now: Date.now(),
    };

    const playerChunkX = Math.floor(player.x / 128);
    const playerChunkY = Math.floor(player.y / 128);

    for (let dx = -player.renderDistance; dx <= player.renderDistance; dx++) {
      for (let dy = -player.renderDistance; dy <= player.renderDistance; dy++) {
        const chunkX = playerChunkX + dx;
        const chunkY = playerChunkY + dy;
        const chunk = world.chunks.get(chunkKey(chunkX, chunkY));
        for (const element of chunk) {
          if (element.elType === "bullet") {
            packet.bullets.push(element);
          }

          if (element.elType === "polygon") {
            packet.polygons.push(element);
          }
        }
      }
    }
  });
        // console.log(world.chunks.get(chunkKey(36, 36)))

  return null;

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
    packet.polygons.push({
      id: polygon.id,
      x: polygon.x,
      y: polygon.y,
      rotation: polygon.rotation,
      type: polygon.type,
    });
  });
}
