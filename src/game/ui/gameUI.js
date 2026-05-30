import { COLORS } from "../data/colors";
import { getLevelData, getPointsToNextLevel } from "../data/levels";
import { state } from "../state";
import Phaser from "phaser";

const upgradesContainer = document.getElementById("upgrades");
let showPanel = false;
let mKey = false;

let currentWidth = 0;
let prevLevel = 1;
let animateProgress = false;

const controlsEl = document.querySelector(".controls")
controlsEl.style.display = "none";

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
        state.inputMap.upgrade = elem.dataset.upgrade;
      }
    });
  }

  // Names
  const nameField = document.getElementById("playerNameInput");
  const nameElement = document.getElementById("playerName");
  nameElement.textContent = nameField.value;
  state.game.player.name = nameField.value;
  detectControlsMode();
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

  // Update Map
  const players = {}
  const leftPercent = state.game.player.x / 9600 * 100
  const topPercent = state.game.player.y / 9600 * 100
  playerLocator.style.top = topPercent + "%"
  playerLocator.style.left = leftPercent + "%"
  playerLocator.style.transform = `translate(-${50}%, -${50}%) rotate(${state.game.player.rotation + Math.PI / 2}rad)`
  const activePlayerIds = new Set();
  players[state.game.player.id] = state.game.player.score;
  activePlayerIds.add(state.game.player.id);

  for (const player of state.game.enemies) {
    activePlayerIds.add(player.id);
    let playerEl = document.getElementById(player.id);
    if (!playerEl) {
      playerEl = document.createElement("div");
      playerEl.id = player.id;
      playerEl.classList.add("enemyLocation");
      map.appendChild(playerEl);
    }
    const pTop = player.y / 9600 * 100;
    const pLeft = player.x / 9600 * 100;
    playerEl.style.top = pTop + "%";
    playerEl.style.left = pLeft + "%";
    playerEl.style.transform = `translate(-50%, -50%)`;
    players[player.id] = player.score;
  }

  for (const el of map.querySelectorAll(".enemyLocation")) {
    if (!activePlayerIds.has(el.id)) {
      el.remove();
    }
  }

  syncUpgradeBars()
  updateScoreboard(Object.entries(players).sort((a, b) => b[1] - a[1]).slice(0, 6));
}

function updateScoreboard(players) {
  const scoreboard = document.getElementById("scoreboard");
  if (!scoreboard) return;
  const topScore = players.length > 0 ? players[0][1] : 1;

  for (const [playerId, playerScore] of players) {
    let playerEl = scoreboard.querySelector(`#${CSS.escape(playerId + "sb")}`);
    if (!playerEl) {
      playerEl = document.createElement("div");
      playerEl.id = playerId + "sb";
      playerEl.classList.add("s-progbar");
      playerEl.innerHTML = `
        <div class="progress"></div>
        <p class="prog-score">0</p>
        <p class="prog-user"></p>
      `;
    }
    const progress = playerEl.querySelector(".progress");
    const widthPercent = (playerScore / topScore) * 100;
    progress.style.width = `${widthPercent}%`;
    if (state.game.player.id == playerId) {
      playerEl.classList.add("currentPlayer");
    }
    playerEl.querySelector(".prog-score").textContent = playerScore;
    const scoreboardName =  (playerId == state.game.player.id) ? state.game.player.name : state.game.enemies.find(item => item.id == playerId).name;
    playerEl.querySelector(".prog-user").textContent = scoreboardName == "" ? "Unnamed Player" : scoreboardName;
    scoreboard.appendChild(playerEl);
  }

  const activeIds = new Set(players.map(([playerId]) => playerId + "sb"));
  for (const el of scoreboard.querySelectorAll(".s-progbar")) {
    if (!activeIds.has(el.id)) {
      el.remove();
    }
  }
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

//
// SETUP CONTROLS
//

function detectControlsMode() {
  if (state.game.onMobile) {
    const map = document.getElementById("map");
    map.style.display = "none";
  } else {
    const moveJoystick = document.getElementById("left-joystick");
    const fireJoystick = document.getElementById("right-joystick");
    moveJoystick.style.display = "none";
    fireJoystick.style.display = "none";
  }
}

// 
// GAMEPAD CONTROLS
// 

window.addEventListener("gamepadconnected", (e) => {
  console.log("damn you've a controller?");
  console.log(e.gamepad);
  state.game.onGamepad = true;
  const controlsEl = document.querySelector(".controls")
  controlsEl.style.display = "flex";
  // requestAnimationFrame(update);
});

window.addEventListener("gamepaddisconnected", () => {
  state.game.onGamepad = false;
  const controlsEl = document.querySelector(".controls")
  controlsEl.style.display = "none";
})

//
// MOBILE CONTROLS
//

const controls = {
  move: { x: 0, y: 0 },
  fire: { x: 0, y: 0 }
};

export function setMobileControls() {
  createJoystick({
    outer: document.getElementById("left-joystick"),
    inner: document.getElementById("left-inner"),
    output: controls.move
  });

  createJoystick({
    outer: document.getElementById("right-joystick"),
    inner: document.getElementById("right-inner"),
    output: controls.fire
  });
}

export function getMobileControls() {
  return controls;
}

function createJoystick({ outer, inner, output }) {
  if (!outer || !inner) return;
  let dragging = false;

  outer.addEventListener("pointerdown", (e) => {
    dragging = true;
    updateJoystick(e);
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateJoystick(e);
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
    inner.style.transform = `translate(-50%, -50%)`;
    output.x = 0;
    output.y = 0;
  });

  function updateJoystick(e) {
    const rect = outer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const maxRadius = rect.width / 2;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    inner.style.transform =
      `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`;
    output.x = dx / maxRadius;
    output.y = dy / maxRadius;
  }
}


//
// DESKTOP CONTROLS
//

document.addEventListener("pointermove", (e) => {
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
  if (upgrade) state.inputMap.upgrade = upgrade.dataset.upgrade;
});
