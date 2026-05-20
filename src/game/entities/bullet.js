import Phaser from "phaser";

export default class Bullet extends Phaser.GameObjects.Arc {
  constructor(scene, id, x, y, lifespan, radius = 5) {
    super(scene, x, y, radius - 1, 0, 360, false, 0x15b5df);
    this.id = id;

    this.setStrokeStyle(2, 0x0f88a9);
    scene.add.existing(this);
    scene.physics.world.enable(this);
    this.body.setCircle(radius);

    this.lifespan = lifespan;
    this.dead = false;
  }

  update(x, y, lifespan) {
    this.x = x;
    this.y = y;
    this.lifespan = lifespan;

    if (this.lifespan <= 30) {
      this.alpha = this.lifespan / 30;
    }
  }
}
