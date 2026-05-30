import Phaser from "phaser";
import { getLevelData } from "../data/levels";
import { state } from "../state";
import Bullet from "./bullet";

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    // Player Shapes
    const pBody = scene.add.circle(0, 0, 12, 0x15b5df);
    pBody.setStrokeStyle(1, 0x0f88a9);
    const weapon = scene.add.rectangle(12, 0, 24, 12, 0x9d9d9d);
    weapon.setStrokeStyle(1, 0x787878);
    const crown = scene.add.image(0, -16, "crown");
    crown.setScale(0.03);
    crown.setAlpha(0)
    const weapons = scene.add.container(0, 0, [weapon]);
    const healthBar = scene.add.graphics();
    super(scene, x, y, [weapons, pBody, crown, healthBar]);

    this.scene = scene;
    this.crown = crown;
    this.weapon = weapon;
    this.weapons = weapons;
    this.healthBar = healthBar;
    this.weaponOriginalX = 12;
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  update(delta) {
    this.x = state.game.player.x;
    this.y = state.game.player.y;
    if (state.game.topPlayer == state.game.player.id) this.crown.setAlpha(0.9);
    else this.crown.setAlpha(0);
    this.updateRotation(delta);
    this.updateDelta(delta);
    this.shoot();
    this.renderUpdate(delta);
  }

  updateRotation(delta) {
    const target = state.game.player.rotation;
    const diff = Phaser.Math.Angle.Wrap(target - this.weapons.rotation);
    const value = this.weapons.rotation + diff * 0.9999 * delta / 100;
    this.weapons.rotation = Number.isFinite(value) ? value : this.weapons.rotation;
  }

  updateDelta(delta) {
    this.velX = (this.x - state.game.player.prevX) / (delta / 1000);
    this.velY = (this.y - state.game.player.prevY) / (delta / 1000);
  }

  shoot() {
    const elapsed = this.now - state.game.player.lastShoot;
    if (elapsed <= 600 / 1.05) {
      this.weapon.x =
        this.weaponOriginalX + Math.sin((Math.PI * elapsed) / 600) * -2;
    } else this.weapon.x = this.weaponOriginalX;
  }

  renderUpdate(delta) {
    this.weapon.scaleX = Phaser.Math.Linear(this.weapon.scaleX, 1, 0.05);
    this.scale = getLevelData(state.game.player.level).tankSize;

    // Camera Zoom
    const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
    const speedFactor = Phaser.Math.Clamp(speed / 180, 0, 1);
    const baseZoom = 2 / this.scale;
    const targetZoom = baseZoom - speedFactor * 0.03; // - shootFactor;
    this.scene.cameras.main.zoom = Phaser.Math.Linear(
      this.scene.cameras.main.zoom,
      targetZoom,
      0.08,
    );

    // Render Health
    this.hp = state.game.player.hp
    if (this.displayHp === undefined) this.displayHp = this.hp;
    this.displayHp += (this.hp - this.displayHp) * 0.99 * (delta / 100);
    this.renderHealthBar(this.displayHp / state.game.player.maxHp);
  }

  renderHealthBar(percent) {
    this.healthBar.clear();
    if (percent > 0.99) return;

    const width = 24;
    const height = 3;
    const radius = height / 2;

    const x = -width / 2;
    const y = 20;

    this.healthBar.fillStyle(0x444444, 1);
    this.healthBar.fillRoundedRect(x, y, width, height, radius);

    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRoundedRect(x, y, width * percent, height, radius);

    this.healthBar.lineStyle(1, 0x444444);
    this.healthBar.strokeRoundedRect(x, y, width, height, radius);
  }
}
