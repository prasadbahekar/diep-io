import Phaser from "phaser";

export default class Polygon extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, type, rotation = 0) {
    super(scene, x, y, 32, 32, 0xffffff);
    this.setStrokeStyle(3, 0x666666);

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

  update(data) {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation;
  }
}
