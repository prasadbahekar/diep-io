import Phaser from "phaser";
import { getLevelData } from "../data/levels";

export default class Enemy extends Phaser.GameObjects.Container {
  constructor (scene, x, y, rotation, type, level) {
    const pBody = scene.add.circle(0, 0, 12, 0x15b5df);
    pBody.setStrokeStyle(1, 0x0f88a9);
    const weapon = scene.add.rectangle(12, 0, 24, 12, 0x9d9d9d);
    weapon.setStrokeStyle(1, 0x787878);
    const weapons = scene.add.container(0, 0, [weapon]);
    const healthBar = scene.add.graphics();
    super(scene, x, y, [weapons, pBody, healthBar]);

    this.rotation = rotation;
    this.scene = scene;
    this.weapon = weapon;
    this.weapons = weapons;
    this.healthBar = healthBar;
    this.weaponOriginalX = 12;
    scene.add.existing(this);
    this.scale = getLevelData(level).tankSize;
  }

  update (x, y, rotation, type, level) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = getLevelData(level).tankSize;
  }
}