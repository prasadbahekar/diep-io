import Phaser from "phaser";
import MenuScene from "./game/scenes/MenuScene";
import { enterFullscreen } from "./game/utils/functions";
import GameScene from "./game/scenes/GameScene";
import {} from "./game/ui/homeMenu";

// Game Initialization
const config = {
  type: Phaser.AUTO,
  parent: document.body,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#454545",
  scene: [MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

// Fullscreen Manager
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
  game.scale.resize(window.innerWidth, window.innerHeight);
  game.scale.resize(window.innerWidth, window.innerHeight);
});
