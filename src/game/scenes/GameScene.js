import Phaser from "phaser";
import Player from "../entities/player";
import { createGameUI, getMobileControls, setMobileControls, updateGameUI } from "../ui/gameUI";
import { state } from "../state";
import { getLevelFromScore } from "../data/levels";
import { regenHP } from "../data/upgrades";
import { input } from "../utils/input";
import Polygon from "../entities/polygon";
import { updateServer, joinPlayer } from "../server/server";
import Bullet from "../entities/bullet";
import { packet } from "../server/packet";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.cellSize = 24;
    this.worldSize = 400 * this.cellSize;

    // Initialize Render Distance
    const renderDistance = Math.floor((Math.max(innerWidth, innerHeight) * 1.25) / 128) + 1;
    state.game.player.id = joinPlayer(renderDistance);
    this.prevLvl = 1;
    this.isAutoRotate = false;

    this.renderedBullets = new Map();
    this.renderedPolygons = new Map();

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    window.addEventListener("mousedown", () => {
      if (!state.game.onMobile) this.isMouseDown = true;
    });

    window.addEventListener("mouseup", () => {
      if (!state.game.onMobile) this.isMouseDown = false;
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "c") {
        this.isAutoRotate = !this.isAutoRotate;
      }
    });

    // Player
    this.player = new Player(this, this.worldSize / 2, this.worldSize / 2);
    this.player.body.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // World Bounds
    this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);
    this.cameras.main.setBounds(0, 0, this.worldSize, this.worldSize);

    // Grid
    this.chunkScreen = Math.max(innerHeight, innerWidth) + this.cellSize * 30; 
    const chunkCellSize = Math.floor(this.chunkScreen / this.cellSize);
    this.grid = this.add
      .grid(0, 0, chunkCellSize * this.cellSize, chunkCellSize * this.cellSize, 24, 24, 0xcccccc, 1, 0xbbbbbb, 1)
      .setOrigin(0, 0);

    this.grid.setDepth(-1);
    this.player.setDepth(4);
    if (state.game.onMobile) setMobileControls();
    createGameUI();
  }

  update(time, delta) {
    this.updateInput();
    updateServer(delta);
    this.updateLocalTruth();
    this.player.update(delta);
    this.updateBullets();
    this.updatePolygons(delta);
    updateGameUI();

    state.game.player.prevX = state.game.player.x;
    state.game.player.prevY = state.game.player.y;
    input.upgrade = null;

    this.grid.x = Phaser.Math.Clamp(
      Math.floor(this.cameras.main.scrollX / this.cellSize) * this.cellSize - this.cellSize * 12,
      0,
      this.worldSize - this.grid.width
    );

    this.grid.y = Phaser.Math.Clamp(
      Math.floor(this.cameras.main.scrollY / this.cellSize) * this.cellSize - this.cellSize * 12,
      0,
      this.worldSize - this.grid.height
    );
}

  updateLocalTruth() {
    state.game.player.x = packet.player.x;
    state.game.player.y = packet.player.y;
    state.game.player.rotation = packet.player.rotation;
    state.game.player.score = packet.player.score;
    state.game.player.level = packet.player.level;
    state.game.player.lastShoot = packet.player.lastShoot;
    state.game.player.upgrades = packet.player.upgrades;
    state.game.player.upLvl = packet.player.upLvls;
    state.game.player.hp = packet.player.hp;
    state.game.player.maxHp = packet.player.maxHp;

    state.game.bullets = packet.bullets;
    state.game.polygons = packet.polygons;
    state.game.packetNow = packet.player.now;
  }
 
  updateInput() {
    if (state.game.onMobile) {
      const controls = getMobileControls();
      input.moveX = controls.move.x;
      input.moveY = controls.move.y;
      input.mouseX = this.player.x + controls.fire.x * 100;
      input.mouseY = this.player.y + controls.fire.y * 100;
      input.shoot = Math.abs(controls.fire.x) > 0.1 || Math.abs(controls.fire.y) > 0.1;
    } else {
      input.moveX = (this.cursors.right.isDown || this.keys.right.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.left.isDown ? 1 : 0);
      input.moveY = (this.cursors.down.isDown || this.keys.down.isDown ? 1 : 0) - (this.cursors.up.isDown || this.keys.up.isDown ? 1 : 0);
      const worldPoint = this.cameras.main.getWorldPoint(this.mouseX, this.mouseY);
      input.mouseX = worldPoint.x;
      input.mouseY = worldPoint.y;
      input.shoot = this.isMouseDown;
      input.isAutoRotate = this.isAutoRotate;
    }

  }

  updateBullets() {
    const bullets = state.game.bullets;
    const rendered = this.renderedBullets;
    state.player.shoot = false;

    const serverIds = new Set();
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      serverIds.add(b.id);

      let bulletObj = rendered.get(b.id);

      if (bulletObj) {
        bulletObj.update(b.x, b.y, b.lifespan);
      } else {
        bulletObj = new Bullet(
          this,
          b.id,
          b.x,
          b.y,
          b.lifespan,
          this.player.weapon.height * 0.8
        );

        rendered.set(b.id, bulletObj);
        if (b.parent === state.game.player.id) {
          state.game.player.lastShoot = Date.now();
        }
      }
    }

    for (const [id, bulletObj] of rendered) {
      if (!serverIds.has(id)) {
        if (bulletObj.destroy) bulletObj.destroy();
        rendered.delete(id);
      }
    }
  }

  updatePolygons(delta) {
    const polygons = state.game.polygons;
    const serverIds = new Set();
    const serverMap = new Map();

    for (const p of polygons) {
      serverIds.add(p.id);
      serverMap.set(p.id, p);
    }

    for (const [id, polyObj] of this.renderedPolygons) {
      if (!serverIds.has(id)) {
        if (polyObj.destroy) {
          polyObj.destroy();
          polyObj.healthBar.destroy();
        }
        this.renderedPolygons.delete(id);
      }
    }

    for (const [id, p] of serverMap) {
      const polyObj = this.renderedPolygons.get(id);

      if (polyObj) {
        polyObj.update(p.x, p.y, p.hp, delta);
      } else {
        this.renderedPolygons.set(
          id,
          new Polygon(this, p.id, p.x, p.y, p.type)
        );
      }
    }
  }

  // updateGameMetrics(delta) {
  //   // Level
  //   state.game.level = getLevelFromScore(state.game.score);
  //   if (this.prevLvl !== state.game.level) {
  //     state.game.upgrades += 1;
  //     this.prevLvl = state.game.level;
  //   }

  //   // Health
  //   state.game.baseHealth = 50 + 2 * (state.game.level - 1);
  //   state.game.maxHealth =
  //     state.game.baseHealth + state.game.stats.maxHealth * 20;

  //   if (isNaN(this.prevMaxHealth)) this.prevMaxHealth = state.game.maxHealth;

  //   if (state.game.maxHealth != this.prevMaxHealth) {
  //     state.game.health =
  //       (state.game.health / this.prevMaxHealth) * state.game.maxHealth;
  //   }

  //   this.prevMaxHealth = state.game.maxHealth;

  //   state.game.health +=
  //     state.game.maxHealth *
  //     regenHP[state.game.stats.regen].percent *
  //     (delta / 1000);

  //   if (state.game.health > state.game.maxHealth) {
  //     state.game.health = state.game.maxHealth;
  //   }
  // }
}