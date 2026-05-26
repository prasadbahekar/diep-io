import { world } from "../server/world";

export function initializeChunks () {
    world.chunks = new Map();
    for (let x = 0; x < 75; x++) {
        for (let y = 0; y < 75; y++) {
            world.chunks.set(`${x},${y}`, new Set());
        }
    }
}

export function updateChunks () {

}

export function chunkKeyWorld(x, y) {
    return `${Math.floor(x/128)},${Math.floor(y/128)}`;
}

export function chunkKey(x, y) {
    return `${x},${y}`;
}

export function chunkKeysWithNeighbors(x, y) {
    const chunkX = Math.floor(x / 128);
    const chunkY = Math.floor(y / 128);

    const chunks = [];

    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            chunks.push(`${chunkX + dx},${chunkY + dy}`);
        }
    }

    return chunks;
}