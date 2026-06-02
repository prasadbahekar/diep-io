import { updateBullets } from "../systems/bulletSystem";
import { updatePlayers, initializePlayer } from "../systems/playerSystem";
import { createPolygon, updatePolygons } from "../systems/polygonSystem";
import { chunkKey, initializeChunks } from "../systems/chunkSystem";
import { Packet, packets } from "./packet";
import { world } from "./world";
import { getRandomInt } from "../utils/functions";
import { inputs } from "../utils/input";
import { updateBots } from "../systems/botSystem";
import { botNames } from "../data/botNames";

export function joinPlayer(renderDistance, playerName, bot = false) {
  return initializePlayer(renderDistance, playerName, bot);
}

export function updateServer(delta) {
  repoulateEntities();
  updateBots();
  initializeChunks();
  updatePolygons(delta);
  updatePlayers(delta);
  updateBullets(delta);
  createPacket();
}

function repoulateEntities() {
  if (world.players.size < 8) {
    const botId = joinPlayer(
      3,
      botNames[Math.floor(Math.random() * botNames.length)],
      true,
    );

    let highestScore = 0;
    for (const player of world.players.values()) {
      if (player.score > highestScore) highestScore = player.score;
    }
    world.players.get(botId).score = Math.floor(
      highestScore * (Math.random() * 0.6),
    );
  }

  if (world.polygons.size < 300) {
    const r = Math.random() * 100;

    let polygonType;
    if (r < 45) {
      polygonType = "square";
    } else if (r < 90) {
      polygonType = "triangle";
    } else if (r < 99.5) {
      polygonType = "pentagon";
    } else {
      polygonType = "hexagon";
    }

    createPolygon(getRandomInt(0, 9600), getRandomInt(0, 9600), polygonType);
  }
}

export function updateServerInput(input, playerId) {
  inputs[playerId] = input;
}

function createPacket() {
  const topPlayer = world.players.values().reduce((max, obj) => {
    return obj.score > max.score ? obj : max;
  });
  for (const player of world.players.values()) {
    if (!player) continue;

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
      topPlayer: topPlayer.id,
    };

    if (player.isBot) continue;

    const top6Players = [...world.players.values()]
      .filter((p) => p && p.id !== player.id)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((p) => ({
        elType: "player",
        x: p.x,
        y: p.y,
        type: "basic",
        hp: p.hp,
        name: p.name,
        maxHp: p.maxHp,
        rotation: p.rotation,
        id: p.id,
        score: p.score,
        level: p.level,
      }));

    const playerChunkX = Math.floor(player.x / 128);
    const playerChunkY = Math.floor(player.y / 128);
    Math.floor(player.y / 128);

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

          if (element.elType === "player" && element.id !== player.id) {
            packet.enemies.push(element);
          }
        }
      }
    }

    const existingIds = new Set(packet.enemies.map((e) => e.id));
    packet.enemies.push(...top6Players.filter((p) => !existingIds.has(p.id)));
    packets[player.id] = packet;
  }
}
