export class Packet {
  constructor() {
    this.player = {
      x: 0,
      y: 0,
      rotation: 0,
      level: 1,
      score: 0,
      lastShoot: 0,
      upgrades: 0,
      hp: 0,
      maxHp: 0,
      now: 0,
      upLvls: "0000000",
    };

    this.bullets = [];
    this.polygons = [];
    this.enemies = [];
  }
}


export const packets = {}