import { COLORS } from "../data/colors";
import { getLevelData, getPointsToNextLevel } from "../data/levels";
import { state } from "../state";
import Phaser from "phaser";
import { input } from "../utils/input";

const upgradesContainer = document.getElementById("upgrades");
let showPanel = false;
let mKey = false;

let currentWidth = 0;
let prevLevel = 1;
let animateProgress = false;

let upgradeElements = [];
const statMap = {
  "Health Regen": "regen",
  "Max Health": "maxHealth",
  "Bullet Speed": "bulletSpeed",
  "Body Damage": "bodyDamage",
  "Bullet Penetration": "bulletPenetration",
  "Bullet Damage": "bulletDamage",
  Reload: "reload",
  "Movement Speed": "movementSpeed",
};

// Initialize Elements
const map = document.getElementById("map");
const playerLocator = document.getElementById("playerPoint");

function createUpgrade(title, hotkey, color = "#000000") {
  const upgrade = document.createElement("div");
  upgrade.className = "upgrade";
  const bars = document.createElement("div");
  bars.className = "bars";
  const texts = document.createElement("div");
  texts.className = "texts";
  const titleEl = document.createElement("p");
  titleEl.className = "title";
  titleEl.textContent = title;
  const hotkeyEl = document.createElement("p");
  hotkeyEl.className = "hotkey";
  hotkeyEl.textContent = `[${hotkey}]`;
  texts.appendChild(titleEl);
  texts.appendChild(hotkeyEl);
  bars.appendChild(texts);

  for (let i = 0; i < 7; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.backgroundColor = color;
    bar.style.opacity = "0";

    bars.appendChild(bar);
  }

  const add = document.createElement("div");
  add.className = "add";
  add.style.backgroundColor = color;
  const plus = document.createElement("p");
  plus.textContent = "+";

  add.appendChild(plus);
  upgrade.appendChild(bars);
  upgrade.appendChild(add);
  upgrade.dataset.color = color;
  upgrade.dataset.upgrade = title;
  upgradesContainer.appendChild(upgrade);

  return upgrade;
}

export function createGameUI() {
  document.getElementById("game-ui").style.display = "block";

  // Upgrades
  createUpgrade("Health Regen", 1, COLORS.peach);
  createUpgrade("Max Health", 2, COLORS.magenta);
  createUpgrade("Bullet Speed", 3, COLORS.purple);
  createUpgrade("Body Damage", 4, COLORS.blue);
  createUpgrade("Bullet Penetration", 5, COLORS.yellow);
  createUpgrade("Bullet Damage", 6, COLORS.red);
  createUpgrade("Reload Speed", 7, COLORS.green);
  createUpgrade("Movement Speed", 8, COLORS.cyan);

  upgradeElements = Array.from(document.getElementsByClassName("upgrade"));

  // Click Events
  for (const elem of upgradeElements) {
    const add = elem.querySelector(".add");
    add.addEventListener("click", () => {
      if (state.game.player.upgrades > 0) { 
        input.upgrade = elem.dataset.upgrade;
      }
    });
  }

  // Names
  const nameField = document.getElementById("playerNameInput");
  const nameElement = document.getElementById("playerName");
  nameElement.textContent = nameField.value;
}

export function updateGameUI() {
  const scoreEl = document.getElementById("scoreTitle");
  const levelEl = document.getElementById("levelTitle");

  scoreEl.textContent = `Score: ${state.game.player.score}`;
  levelEl.textContent = `Lvl ${state.game.player.level} Tank`;

  updateProgressBar();

  if (showPanel || mKey || state.game.player.upgrades > 0) {
    upgradesContainer.classList.add("active");
  } else {
    upgradesContainer.classList.remove("active");
  }

  for (const elem of upgradeElements) {
    const add = elem.querySelector(".add");
    const disabled = state.game.player.upgrades == 0;
    add.classList.toggle("disabled", disabled);
    add.style.backgroundColor = disabled ? "#999" : elem.dataset.color;
  }

  const upgradeCount = document.getElementById("upgrade-count");
  upgradeCount.textContent =
    state.game.player.upgrades > 1 ? `${state.game.player.upgrades}x` : "";

  syncUpgradeBars();
  // Update Map
  const leftPercent = state.game.player.x / 9600 * 100
  const topPercent = state.game.player.y / 9600 * 100
  playerLocator.style.top = topPercent + "%"
  playerLocator.style.left = leftPercent + "%"
  playerLocator.style.transform = `translate(-${50}%, -${50}%) rotate(${state.game.player.rotation + Math.PI / 2}rad)`
}

function updateUpgrades(title) {
  if (state.game.player.upgrades <= 0) return;

  const upgradeIndexMap = {
    "Health Regen": 0,
    "Max Health": 1,
    "Bullet Speed": 2,
    "Body Damage": 3,
    "Bullet Penetration": 4,
    "Bullet Damage": 5,
    "Reload Speed": 6,
    "Movement Speed": 7,
  };

  const index = upgradeIndexMap[title];

  if (index === undefined) return;
  if (!state.game.player.upLvl) {
    state.game.player.upLvl = "00000000";
  }
  const levels = state.game.player.upLvl.split("");
  let currentLevel = parseInt(levels[index]);
  if (currentLevel >= 7) return;
  currentLevel += 1;
  levels[index] = currentLevel.toString();
  state.game.player.upLvl = levels.join("");
  state.game.player.upgrades -= 1;
  const upgrade = upgradeElements.find(
    (elem) => elem.dataset.upgrade === title,
  );

  if (!upgrade) return;

  const bars = upgrade.querySelectorAll(".bar");

  bars.forEach((bar, i) => {
    bar.style.opacity = i < currentLevel ? "1" : "0";
  });
}

function syncUpgradeBars() {
  if (!state.game.player.upLvl) {
    state.game.player.upLvl = "00000000";
  }

  const levels = state.game.player.upLvl.split("");

  upgradeElements.forEach((upgradeElem, index) => {
    const bars = upgradeElem.querySelectorAll(".bar");
    const level = parseInt(levels[index]) || 0;

    bars.forEach((bar, i) => {
      bar.style.opacity = i < level ? "1" : "0";
    });
  });
}

function updateProgressBar() {
  const levelProgress =
    (state.game.player.score -
      getLevelData(state.game.player.level).pointsNeeded) /
    getPointsToNextLevel(state.game.player.level);

  let targetWidth = levelProgress * 100;
  let lerpSpeed = 0.05;

  if (state.game.player.level !== prevLevel || animateProgress) {
    targetWidth = 100;
    lerpSpeed = 0.075;
    if (Math.round(currentWidth) == targetWidth) {
      animateProgress = true;
      prevLevel = state.game.player.level;
    }

    if (animateProgress) {
      targetWidth = 5;
      if (Math.round(currentWidth) == targetWidth) {
        animateProgress = false;
      }
    }
  } else {
    targetWidth = levelProgress * 100;
    prevLevel = state.game.player.level;
  }

  if (targetWidth < 5) targetWidth = 5;
  if (targetWidth > 100) targetWidth = 100;
  const levelProgEl = document.getElementById("levelProgress");
  currentWidth = Phaser.Math.Linear(currentWidth, targetWidth, lerpSpeed);
  levelProgEl.style.width = `${currentWidth}%`;
}

document.addEventListener("mousemove", (e) => {
  showPanel = e.clientX < 224 && e.clientY > window.innerHeight - 224;
});

document.addEventListener("keydown", (e) => {
  mKey = e.key == "m";
});

document.addEventListener("keyup", (e) => {
  if (mKey && e.key == "m") mKey = false;
});

document.addEventListener("keydown", (e) => {
  const key = parseInt(e.key);
  if (isNaN(key)) return;
  if (key < 1 || key > 8) return;
  if (state.game.player.upgrades <= 0) return;
  const upgrade = upgradeElements[key - 1];
  if (upgrade) input.upgrade = upgrade.dataset.upgrade;
});
