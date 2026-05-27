import Phaser from "phaser";
import { getLevelData } from "../data/levels";

export default class Enemy extends Phaser.GameObjects.Container {
  constructor (scene, x, y, rotation, type, level) {
    const pBody = scene.add.circle(0, 0, 12, 0xf14e54);
    pBody.setStrokeStyle(1, 0xb43a3f);
    const weapon = scene.add.rectangle(12, 0, 24, 12, 0x9d9d9d);
    weapon.setStrokeStyle(1, 0x787878);
    const weapons = scene.add.container(0, 0, [weapon]);
    const healthBar = scene.add.graphics();
    super(scene, x, y, [weapons, pBody, healthBar]);

    this.scene = scene;
    this.weapon = weapon;
    this.weapons = weapons;
    this.healthBar = healthBar;
    this.weaponOriginalX = 12;
    scene.add.existing(this);
    this.scale = getLevelData(level).tankSize;
    this.weapons.rotation = rotation;

    this.healthBar = scene.add.graphics();
    this.healthBar.setAlpha(0.8);
    this.healthBar.setDepth(3);
    this.setDepth(2);
  }

  update (player, delta) {
    this.x = player.x;
    this.y = player.y;
    this.hp = player.hp
    this.targetRotation = player.rotation;
    this.scale = getLevelData(player.level).tankSize;
    this.updateRotation(delta);

    this.healthBar.x = player.x;
    this.healthBar.y = player.y;
    if (this.displayHp === undefined) this.displayHp = this.hp;
    this.displayHp += (this.hp - this.displayHp) * 0.99 * (delta / 100);
    this.renderHealthBar(this.displayHp / player.maxHp);
  }

  updateRotation(delta) {
    const diff = Phaser.Math.Angle.Wrap(this.targetRotation - this.weapons.rotation);
    const value = this.weapons.rotation + diff * 0.99 * delta / 100;
    this.weapons.rotation = Number.isFinite(value) ? value : this.weapons.rotation;
  }
  

  renderHealthBar(percent) {
    this.healthBar.clear();
    if (percent >= 0.99) return;

    const width = 44;
    const height = 6;
    const radius = height / 2;
    const x = -width / 2;
    const y = 32;

    this.healthBar.fillStyle(0x444444, 1);
    this.healthBar.fillRoundedRect(x, y, width, height, radius);

    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRoundedRect(x, y, width * percent, height, radius);

    this.healthBar.lineStyle(2, 0x444444);
    this.healthBar.strokeRoundedRect(x, y, width, height, radius);
  }
}