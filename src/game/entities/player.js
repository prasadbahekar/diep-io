import Phaser from "phaser";
import { getLevelData } from "../data/levels";
import { state } from "../state";
import Bullet from "./bullet";
import { packet } from "../server/packet";

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    // Player Shapes
    const pBody = scene.add.circle(0, 0, 12, 0x15b5df);
    pBody.setStrokeStyle(1, 0x0f88a9);

    const weapon = scene.add.rectangle(12, 0, 24, 12, 0x9d9d9d);
    weapon.setStrokeStyle(1, 0x787878);

    const weapons = scene.add.container(0, 0, [weapon]);
    const healthBar = scene.add.graphics();

    super(scene, x, y, [weapons, pBody, healthBar]);

    this.scene = scene;
    this.weapon = weapon;
    this.weapons = weapons;
    this.healthBar = healthBar;
    this.bullets = [];

    // Variables
    this.isShooting = false;
    this.weaponOriginalX = 12;

    // Movement
    this.autoRotate = false;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setDrag(100, 100);
    this.body.setMaxVelocity(160, 160);

    // Mouse
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;

    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener("mousedown", () => {
      this.isMouseDown = true;
    });

    window.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });

    // Toggle auto rotate
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "c") {
        this.autoRotate = !this.autoRotate;
      }
    });
  }

  update(delta) {
    this.x = state.game.player.x;
    this.y = state.game.player.y;
    this.updateRotation(delta);
    this.updateDelta();
    this.shoot();
    this.renderUpdate();
  }

  updateRotation(delta) {
    const target = state.game.player.rotation;
    const diff = Phaser.Math.Angle.Wrap(target - this.weapons.rotation);
    const value = this.weapons.rotation + diff * 0.9999 * delta / 100;
    this.weapons.rotation = Number.isFinite(value) ? value : this.weapons.rotation;
  }

  updateDelta() {
    this.now = Date.now();
    this.elapsed = this.now - state.game.packetNow;
    if (this.elapsed <= 0) this.elapsed = 1;
    this.velX = (this.x - state.game.player.prevX) / (this.elapsed / 70);
    this.velY = (this.y - state.game.player.prevY) / (this.elapsed / 70);
  }

  shoot() {
    const elapsed = this.now - state.game.player.lastShoot;
    if (elapsed <= 600 / 1.05) {
      this.weapon.x =
        this.weaponOriginalX + Math.sin((Math.PI * elapsed) / 600) * -2;
    } else this.weapon.x = this.weaponOriginalX;
  }

  renderUpdate() {
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

    // Update bullets
    for (const bullet of this.bullets) {
      bullet.update();
    }
    this.bullets = this.bullets.filter((bullet) => !bullet.dead);

    // Render Health
    if (state.game.player.hp == state.game.player.maxHp) this.healthBar.clear();
    else this.renderHealthBar(state.game.player.hp / state.game.player.maxHp);
  }

  renderHealthBar(percent) {
    this.healthBar.clear();

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
