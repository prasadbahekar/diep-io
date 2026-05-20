import Phaser from "phaser";

export default class Polygon extends Phaser.GameObjects.Rectangle {
  constructor(scene, id, x, y, type, rotation = 0) {
    super(scene, x, y, 32, 32, 0xffffff);
    this.setStrokeStyle(2, 0x666666);

    scene.add.existing(this);

    this.type = type;

    this.setRotation(rotation);

    // Different polygon styles
    switch (type) {
      case "square":
        this.setFillStyle(0xffe066);
        break;

      case "triangle":
        this.setFillStyle(0xff6666);
        break;

      case "pentagon":
        this.setFillStyle(0x66ccff);
        break;
    }
  }

  update(x, y, rotation) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
  }
}
