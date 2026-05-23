import { updateBullets } from "../systems/bulletSystem";
import { updatePlayers, initializePlayer } from "../systems/playerSystem";
import { createPolygon, updatePolygons } from "../systems/polygonSystem";
import { chunkKey, chunkKeyWorld, initializeChunks, updateChunks } from "../systems/chunkSystem";
import { packet } from "./packet";
import { world } from "./world";

export function joinPlayer(renderDistance) {
  createPolygon(4600, 4600, "square")
  return initializePlayer(renderDistance);
}

export function updateServer(delta) {
  initializeChunks();
  updatePlayers(delta);
  updatePolygons(delta);
  updateBullets(delta);
  createPacket();
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
}
