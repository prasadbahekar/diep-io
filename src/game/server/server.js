import { updateBullets } from "../systems/bulletSystem";
import { updatePlayers, initializePlayer } from "../systems/playerSystem";
import { createPolygon, updatePolygons } from "../systems/polygonSystem";
import { chunkKey, chunkKeyWorld, initializeChunks, updateChunks } from "../systems/chunkSystem";
import { Packet, packets } from "./packet";
import { world } from "./world";
import { getRandomInt } from "../utils/functions";
import { inputs } from "../utils/input";

export function joinPlayer(renderDistance) {
  const types = ["square", "square", "triangle", "triangle", "pentagon"];
  for (let i = 0; i < 50; i++) createPolygon(getRandomInt(0, 9600), getRandomInt(0, 9600), types[getRandomInt(0, types.length - 1)]);
  return initializePlayer(renderDistance);
}

export function updateServer(delta) {
  initializeChunks();
  updatePolygons(delta);
  updatePlayers(delta);
  updateBullets(delta);
  createPacket();
}

export function updateServerInput(input, playerId) {
  inputs[playerId] = input;
}

function createPacket() {
  world.players.forEach((player) => {
    const packet = new Packet();
    packet.player = {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
      level: player.level,
      score: player.score,
      upLvls: player.upLvl,
      lastShoot: player.lastShoot,
      upgrades: player.upgrades,
      hp: player.hp,
      maxHp: player.maxHp,
      now: Date.now(),
    };

    const playerChunkX = Math.floor(player.x / 128);
    const playerChunkY = Math.floor(player.y / 128);

    for (let dx = -player.renderDistance; dx <= player.renderDistance; dx++) {
      for (let dy = -player.renderDistance; dy <= player.renderDistance; dy++) {
        const chunkX = playerChunkX + dx;
        const chunkY = playerChunkY + dy;
        const chunk = world.chunks.get(chunkKey(chunkX, chunkY));
        if (!chunk) continue;

        for (const element of chunk) {
          if (element.elType === "bullet") {
            packet.bullets.push(element);
          }

          if (element.elType === "polygon") {
            packet.polygons.push(element);
          }

          if (element.elType === "player") {
            if (element.id != player.id) packet.enemies.push(element);
          }
        }
      }
    }

    packets[player.id] = packet;
  });
}
