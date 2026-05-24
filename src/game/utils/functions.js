export function enterFullscreen() {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    // Safari
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    // old Edge
    return elem.msRequestFullscreen();
  }
}

export function getRandomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}