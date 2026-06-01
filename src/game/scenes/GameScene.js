import Phaser from "phaser";
import Player from "../entities/player";
import {
  createGameUI,
  getMobileControls,
  setMobileControls,
  updateGameUI,
} from "../ui/gameUI";
import { state } from "../state";
import Polygon from "../entities/polygon";
import { updateServer, joinPlayer, updateServerInput } from "../server/server";
import Bullet from "../entities/bullet";
import { packets } from "../server/packet";
import { getGamepadControls } from "../utils/functions";
import Enemy from "../entities/enemy";
import Locator from "../entities/locator";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.image(
      "crown",
      `${import.meta.env.BASE_URL}assets/textures/game/crown.png`,
    );
    this.load.image(
      "arrow",
      `${import.meta.env.BASE_URL}assets/textures/game/arrow.png`,
    );
  }

  create() {
    state.game.started = true;
    this.cellSize = 24;
    this.worldSize = 400 * this.cellSize;

    // Initialize Render Distance
    const renderDistance =
      Math.floor((Math.max(innerWidth, innerHeight) * 1.25) / 128) + 1;
    state.game.player.id = joinPlayer(renderDistance, state.game.player.name);
    this.prevLvl = 1;
    this.isAutoRotate = false;

    this.renderedBullets = new Map();
    this.renderedPolygons = new Map();
    this.renderedEnemies = new Map();

    this.prevDpadDown = false;
    this.gamepadAutoR = false;
    this.gamepadX = 100;
    this.gamepadY = 0;

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

    window.addEventListener("mousedown", (e) => {
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

    // Bots
    // this.bots = [];
    // for (let i = 0; i < 5; i++) {
    //   const botId = joinPlayer(renderDistance, botNames[Math.floor(Math.random() * botNames.length)], true);
    //   this.bots.push(botId);
    // }

    // Player
    this.player = new Player(this, this.worldSize / 2, this.worldSize / 2);
    this.player.body.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // World Bounds
    this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);
    this.cameras.main.setBounds(0, 0, this.worldSize, this.worldSize);

    // Boss Locator
    this.topLocator = new Locator(this, 0, 0, "Top Player");

    // Grid
    this.chunkScreen = Math.max(innerHeight, innerWidth) + this.cellSize * 40;
    const chunkCellSize = Math.floor(this.chunkScreen / this.cellSize);
    this.grid = this.add
      .grid(
        0,
        0,
        chunkCellSize * this.cellSize,
        chunkCellSize * this.cellSize,
        24,
        24,
        0xcccccc,
        1,
        0xbbbbbb,
        1,
      )
      .setOrigin(0, 0);

    this.grid.setDepth(-1);
    this.player.setDepth(4);
    if (state.game.onMobile) setMobileControls();
    createGameUI();
  }

  update(time, delta) {
    this.updateInput();
    updateServerInput(state.inputMap, state.game.player.id);
    updateServer(delta);
    this.updateLocalTruth();
    this.player.update(delta);
    this.updateBullets();
    this.updatePolygons(delta);
    this.updateEnemies(delta);
    // this.topLocator.update(0, 0)
    this.updateLocators();
    updateGameUI();

    state.game.player.prevX = state.game.player.x;
    state.game.player.prevY = state.game.player.y;
    state.inputMap.upgrade = null;

    this.grid.x = Phaser.Math.Clamp(
      Math.floor(this.cameras.main.scrollX / this.cellSize) * this.cellSize -
        this.cellSize * 20,
      0,
      this.worldSize - this.grid.width,
    );

    this.grid.y = Phaser.Math.Clamp(
      Math.floor(this.cameras.main.scrollY / this.cellSize) * this.cellSize -
        this.cellSize * 20,
      0,
      this.worldSize - this.grid.height,
    );
  }

  updateLocalTruth() {
    const packet = packets[state.game.player.id];
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
    state.game.topPlayer = packet.player.topPlayer;

    state.game.bullets = packet.bullets;
    state.game.polygons = packet.polygons;
    state.game.enemies = packet.enemies;
    state.game.packetNow = packet.player.now;
  }

  updateInput() {
    if (state.game.onGamepad) {
      const gamepad = getGamepadControls();
      state.inputMap.moveX =
        Math.abs(gamepad.axes[0]) < 0.001 ? 0 : gamepad.axes[0];
      state.inputMap.moveY =
        Math.abs(gamepad.axes[1]) < 0.001 ? 0 : gamepad.axes[1];
      this.gamepadX =
        Math.abs(gamepad.axes[2]) < 0.1 ? this.gamepadX : gamepad.axes[2] * 100;
      this.gamepadY =
        Math.abs(gamepad.axes[3]) < 0.1 ? this.gamepadY : gamepad.axes[3] * 100;
      state.inputMap.mouseX = this.player.x + this.gamepadX;
      state.inputMap.mouseY = this.player.y + this.gamepadY;
      state.inputMap.shoot =
        gamepad.buttons[6].pressed || gamepad.buttons[7].pressed;
      const dpadDownPressed = gamepad.buttons[13].pressed;
      if (dpadDownPressed && !this.prevDpadDown)
        this.gamepadAutoR = !this.gamepadAutoR;
      this.prevDpadDown = dpadDownPressed;
      state.inputMap.isAutoRotate = this.gamepadAutoR;
    } else if (state.game.onMobile) {
      const controls = getMobileControls();
      state.inputMap.moveX = controls.move.x;
      state.inputMap.moveY = controls.move.y;
      state.inputMap.mouseX = this.player.x + controls.fire.x * 100;
      state.inputMap.mouseY = this.player.y + controls.fire.y * 100;
      state.inputMap.shoot =
        Math.abs(controls.fire.x) > 0.1 || Math.abs(controls.fire.y) > 0.1;
    } else {
      state.inputMap.moveX =
        (this.cursors.right.isDown || this.keys.right.isDown ? 1 : 0) -
        (this.cursors.left.isDown || this.keys.left.isDown ? 1 : 0);
      state.inputMap.moveY =
        (this.cursors.down.isDown || this.keys.down.isDown ? 1 : 0) -
        (this.cursors.up.isDown || this.keys.up.isDown ? 1 : 0);
      const worldPoint = this.cameras.main.getWorldPoint(
        this.mouseX,
        this.mouseY,
      );
      state.inputMap.mouseX = worldPoint.x;
      state.inputMap.mouseY = worldPoint.y;
      state.inputMap.shoot = this.isMouseDown;
      state.inputMap.isAutoRotate = this.isAutoRotate;
    }
  }

  updateLocators() {
    if (state.game.topPlayer != state.game.player.id) {
      const bot = state.game.enemies.find((p) => p.id == state.game.topPlayer);
      this.topLocator.update(bot.x, bot.y);
    } else {
      this.topLocator.update(0, 0);
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
          this.player.weapon.height * 0.8,
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
          new Polygon(this, p.id, p.x, p.y, p.type),
        );
      }
    }
  }

  updateEnemies(delta) {
    const enemies = state.game.enemies;
    const serverIds = new Set();
    const serverMap = new Map();

    for (const e of enemies) {
      serverIds.add(e.id);
      serverMap.set(e.id, e);
    }

    for (const [id, enemyObj] of this.renderedEnemies) {
      if (!serverIds.has(id)) {
        if (enemyObj.destroy) enemyObj.destroy();
        this.renderedEnemies.delete(id);
      }
    }

    for (const [id, e] of serverMap) {
      const enemyObj = this.renderedEnemies.get(id);
      if (enemyObj) {
        enemyObj.update(e, delta);
      } else {
        this.renderedEnemies.set(
          id,
          new Enemy(this, e.name, e.x, e.y, e.rotation, e.type, e.level),
        );
      }
    }
  }
}
