import Phaser from "phaser";
import Player from "../entities/player";
import { createGameUI, updateGameUI } from "../ui/gameUI";
import { state } from "../state";
import { getLevelFromScore } from "../data/levels";
import { regenHP } from "../data/upgrades";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const cellSize = 24;
    const worldSize = 400 * cellSize;
    this.prevLvl = 1;

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Player
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

    this.grid.setDepth(0);
    this.player.setDepth(1);

    createGameUI();
  }

  update(time, delta) {
    this.player.update(this.cursors, this.keys, this.cameras.main);
    this.updateGameMetrics(delta);
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
    console.log(this.prevMaxHealth);

    if (state.game.maxHealth != this.prevMaxHealth) {
      console.log(state.game.health);
      state.game.health =
        (state.game.health / this.prevMaxHealth) * state.game.maxHealth;
      console.log(state.game.health);
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
