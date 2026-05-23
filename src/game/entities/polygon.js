import Phaser from "phaser";
import { polygons } from "../data/polygons";

export default class Polygon extends Phaser.GameObjects.Container {
  constructor(scene, id, x, y, type, rotation = 0) {
    super(scene, x, y);

    this.id = id;
    this.type = type;

    let bodyObj;

    switch (type) {
      case "triangle": {
        const r = 20;

        const points = [
          r,
          0,
          -r / 2,
          (Math.sqrt(3) * r) / 2,
          -r / 2,
          (-Math.sqrt(3) * r) / 2,
        ];

        bodyObj = new Phaser.GameObjects.Polygon(scene, 0, 0, points, 0xeb6767);
        bodyObj.setPosition(bodyObj.width / 2, bodyObj.height / 2);

        break;
      }

      case "square": {
        bodyObj = new Phaser.GameObjects.Rectangle(
          scene,
          0,
          0,
          28,
          28,
          0xe7d063,
        );

        break;
      }

      case "pentagon": {
        const r = 20;
        const points = [];

        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5;

          points.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }

        bodyObj = new Phaser.GameObjects.Polygon(scene, 0, 0, points, 0x66eae6);

        const bounds = bodyObj.getBounds();
        bodyObj.setPosition(-bounds.x, -bounds.y);

        break;
      }

      default: {
        bodyObj = new Phaser.GameObjects.Rectangle(
          scene,
          0,
          0,
          20,
          20,
          0xffffff,
        );
      }
    }

    bodyObj.setStrokeStyle(2, 0x666666);
    this.add(bodyObj);
    this.bodyObj = bodyObj;
    this.healthBar = scene.add.graphics();
    this.healthBar.setAlpha(0.8);
    scene.add.existing(this);
    this.rotation = rotation;
  }

  update(x, y, rotation, hp) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.hp = hp;
    this.healthBar.x = x;
    this.healthBar.y = y;
    console.log(polygons[this.type].hp)
    this.renderHealthBar(this.hp / polygons[this.type].hp);
  }

  renderHealthBar(percent) {
    this.healthBar.clear();
    if (percent >= 1) return;
    const width = 38;
    const height = 4;
    const radius = height / 2;

    const x = -width / 2;
    const y = 24;

    this.healthBar.fillStyle(0x444444, 1);
    this.healthBar.fillRoundedRect(x, y, width, height, radius);

    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRoundedRect(x, y, width * percent, height, radius);

    this.healthBar.lineStyle(1, 0x444444);
    this.healthBar.strokeRoundedRect(x, y, width, height, radius);
  }
}
