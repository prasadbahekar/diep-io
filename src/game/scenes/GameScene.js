import Phaser from "phaser";
import Player from "../entities/player";
import { createGameUI, updateGameUI } from "../ui/gameUI";
import { state } from "../state";
import { getLevelFromScore } from "../data/levels";
import { regenHP } from "../data/upgrades";
import Polygon from "../entities/polygon";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const cellSize = 24;
    const worldSize = 400 * cellSize;
    this.prevLvl = 1;

    // Polygons
    state.game.polygons = [
      {
        id: 1,
        type: "square",
        x: 0,
        y: 0,
        rotation: 0,
      },
      {
        id: 2,
        type: "square",
        x: worldSize / 2 - 100,
        y: worldSize / 2 - 50,
        rotation: 0,
      },
    ];

    this.polygonObjects = [];

    state.game.polygons.forEach((polygonData) => {
      const polygon = new Polygon(
        this,
        polygonData.x,
        polygonData.y,
        polygonData.type,
        polygonData.rotation,
      );

      polygon.id = polygonData.id;

      this.polygonObjects.push(polygon);
    });

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Player
    // this.player = new Player(this, 2, 2);
    this.player = new Player(this, worldSize / 2, worldSize / 2);
    this.player.body.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // World Bounds
    this.physics.world.setBounds(0, 0, worldSize, worldSize);

    // Grid
    this.grid = this.add
      .grid(0, 0, worldSize, worldSize, 24, 24, 0xcccccc, 1, 0xbbbbbb, 1)
      .setOrigin(0, 0);

    this.grid.setDepth(-1);
    this.player.setDepth(1);

    createGameUI();
  }

  update(time, delta) {
    this.player.update(this.cursors, this.keys, this.cameras.main);
    this.updateGameMetrics(delta);

    // Update polygons
    this.polygonObjects.forEach((polygon) => {
      const data = state.game.polygons.find((p) => p.id === polygon.id);
      if (data) data.rotation += 0.001 * delta;
      polygon.update(data);
    });

    updateGameUI();
  }

  updateGameMetrics(delta) {
    // Level
    state.game.level = getLevelFromScore(state.game.score);
    if (this.prevLvl !== state.game.level) {
      state.game.upgrades += 1;
      this.prevLvl = state.game.level;
    }

    // Health
    state.game.baseHealth = 50 + 2 * (state.game.level - 1);
    state.game.maxHealth =
      state.game.baseHealth + state.game.stats.maxHealth * 20;

    if (isNaN(this.prevMaxHealth)) this.prevMaxHealth = state.game.maxHealth;

    if (state.game.maxHealth != this.prevMaxHealth) {
      state.game.health =
        (state.game.health / this.prevMaxHealth) * state.game.maxHealth;
    }

    this.prevMaxHealth = state.game.maxHealth;

    state.game.health +=
      state.game.maxHealth *
      regenHP[state.game.stats.regen].percent *
      (delta / 1000);

    if (state.game.health > state.game.maxHealth) {
      state.game.health = state.game.maxHealth;
    }
  }
}
