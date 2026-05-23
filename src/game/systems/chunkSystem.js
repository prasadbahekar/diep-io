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