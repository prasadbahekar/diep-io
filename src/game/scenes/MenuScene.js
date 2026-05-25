import Phaser from "phaser";
import { enterFullscreen } from "../utils/functions";
import { state } from "../state";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  preload() {
    this.load.audio("start", `${import.meta.env.BASE_URL}assets/sounds/ui/start-game.mp3`);
  }

  create() {
    const ui = document.getElementById("home-menu");
    const button = document.getElementById("startBtn");
    const buttonText = document.getElementById("startBtnLbl");
    ui.style.display = "flex";
    state.game.started = false;

    button.onclick = async () => {
      try {
        state.game.started = true;
        this.sound.play("start");
        await new Promise((resolve) => setTimeout(resolve, 100));
        buttonText.innerText = "Loading...";
        await new Promise((resolve) => setTimeout(resolve, 1900));
        await enterFullscreen();
        ui.style.display = "none";
        this.scene.start("GameScene");
        buttonText.innerText = "Play!";
      } catch (err) {
        alert("Please allow fullscreen to play the game!");
      }
    };

    // document.addEventListener("fullscreenchange", () => {
    //   if (!document.fullscreenElement)
    //     document.getElementById("home-menu").style.display = "flex";
    // });
  }
}
