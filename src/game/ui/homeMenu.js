import { ACHIEVEMENTS } from "../data/advancements.js";
import { state } from "../state.js";
import { getGamepadControls } from "../utils/functions.js";

let scrollOffset = -16;
let smoothOffset = 8;
let showPanel = false;

function createAdvancement(data) {
  const outer = document.createElement("div");
  outer.classList.add("advancement");
  const wrapper = document.createElement("div");
  wrapper.classList.add("advancement-wrapper");
  const inner = document.createElement("div");
  inner.classList.add("advancement-inner");

  inner.innerHTML = `
    <h3>${data.title}</h3>
    <p>${data.desc}</p>
  `;

  inner.style.backgroundColor = data.color;

  wrapper.appendChild(inner);
  outer.appendChild(wrapper);
  return outer;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".advancements");

  ACHIEVEMENTS.forEach((ach) => {
    const el = createAdvancement(ach);
    container.appendChild(el);
  });

  startLoop();
});

const nameInput = document.getElementById("playerNameInput");
nameInput.value = localStorage.getItem("playerNameValue") || "";
nameInput.addEventListener("input", () => {
  localStorage.setItem("playerNameValue", nameInput.value);
});

document.addEventListener("mousemove", (e) => {
  showPanel = e.clientX > window.innerWidth - 208;
});

document.addEventListener("wheel", (e) => {
  if (!showPanel) return;
  updateScrollOffset(e.deltaY * -0.5);
});

function updateCarousel() {
  const allAdvancements = document.querySelectorAll(".advancement");

  if (showPanel) updateScrollOffset(-0.4);
  const lerpFactor = 0.08;
  smoothOffset += (scrollOffset - smoothOffset) * lerpFactor;

  allAdvancements.forEach((adv, index) => {
    // Scroll
    const container = document.querySelector(".advancements");
    const containerRect = container.getBoundingClientRect();
    const wrapper = adv.querySelector(".advancement-wrapper");
    const inner = adv.querySelector(".advancement-inner");

    if (showPanel) {
      adv.classList.add("show");
    } else {
      adv.classList.remove("show");
    }

    // Fade
    const y = smoothOffset;
    const newY = y + adv.getBoundingClientRect().top;
    const distance = Math.abs(newY - innerHeight / 2);
    const normalized = distance / (innerHeight / 2);
    const curved = Math.pow(1 - normalized, 1.4);
    const opacity = Math.min(0.6, curved * 0.6);
    inner.style.opacity = opacity;
    wrapper.style.transform = `translateY(${y}px) translateX(${-opacity * 8}px)`;
  });
}

function updateScrollOffset(value) {
  const allAdvancements = document.querySelectorAll(".advancement");
  const lastAdvancement =
    allAdvancements[allAdvancements.length - 1].getBoundingClientRect().bottom;

  if (lastAdvancement + scrollOffset + value < innerHeight) {
  } else if (
    allAdvancements[0].getBoundingClientRect().top + scrollOffset + value >
    16
  ) {
  } else {
    scrollOffset += value;
  }
}

function detectGamepadInput () {
  if (!state.game.onGamepad) return;
  const gamepad = getGamepadControls();
  if (gamepad.buttons[0].pressed) {
    const button = document.getElementById("startBtn");
    if (!state.game.started) button.click();
  }
}

// --- Gamepad Detection ---
window.addEventListener("gamepadconnected", (e) => {
  console.log("damn you've a controller?");
  state.game.onGamepad = true;
});

window.addEventListener("gamepaddisconnected", () => {
  state.game.onGamepad = false;
})

// --- Game loop ---
function startLoop() {
  function loop() {
    updateCarousel();
    detectGamepadInput();
    requestAnimationFrame(loop);
  }
  loop();
}
