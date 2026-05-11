import Phaser from "phaser";

export default class Bullet extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, radius = 5, velX = 0, velY = 0) {
    super(scene, x, y, radius - 1, 0, 360, false, 0x15b5df);

    this.velX = velX;
    this.velY = velY;

    this.setStrokeStyle(2, 0x0f88a9);
    scene.add.existing(this);
    scene.physics.world.enable(this);
    this.body.setCircle(radius);

    this.lifespan = 200;
    this.dead = false;
  }

  update() {
    this.lifespan--;
    this.x += this.velX;
    this.y += this.velY;

    if (this.lifespan <= 50) {
      this.alpha = this.lifespan / 50;
    }

    if (this.lifespan <= 0) {
      this.destroy();
      this.dead = true;
    }
  }
}
