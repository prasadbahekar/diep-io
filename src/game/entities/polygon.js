import Phaser from "phaser";
import { polygons } from "../data/polygons";

export default class Polygon extends Phaser.GameObjects.Container {
  constructor(scene, id, x, y, type, rotation = 0) {
    super(scene, x, y);

    this.id = id;
    this.type = type;
    this.rotateSide = Math.random() < 0.5 ? -1 : 1;

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
        bodyObj.setStrokeStyle(2, 0xbb5453);
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
        bodyObj.setStrokeStyle(2, 0xbdad4a);
        break;
      }

      case "pentagon": {
        const r = 30;
        const points = [];

        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5;
          points.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }

        bodyObj = new Phaser.GameObjects.Polygon(scene, 0, 0, points, 0x6690ea);
        bodyObj.setStrokeStyle(3, 0x566abc);
        const bounds = bodyObj.getBounds();
        bodyObj.setPosition(-bounds.x, -bounds.y);
        break;
      }

      case "hexagon": {
        const r = 35;
        const points = [];

        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          points.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }

        bodyObj = new Phaser.GameObjects.Polygon(scene, 0, 0, points, 0x35c5db);
        bodyObj.setStrokeStyle(3, 0x2eaabd);
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
        bodyObj.setStrokeStyle(2, 0x666666);
      }
    }

    this.add(bodyObj);
    this.bodyObj = bodyObj;
    this.healthBar = scene.add.graphics();
    this.healthBar.setAlpha(0.8);
    this.healthBar.setDepth(3);
    scene.add.existing(this);
  }

  update(x, y, hp, delta) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.rotation += ((this.rotateSide * delta) / 1000) * 0.2;

    this.healthBar.x = x;
    this.healthBar.y = y;

    if (this.displayHp === undefined) {
      this.displayHp = hp;
    }

    this.displayHp += (hp - this.displayHp) * 0.99 * (delta / 100);

    this.renderHealthBar(this.displayHp / polygons[this.type].hp);
  }

  renderHealthBar(percent) {
    this.healthBar.clear();
    if (percent >= 0.99) return;

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
