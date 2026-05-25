export class Input {
  constructor() {
    this.moveX = 0;
    this.moveY = 0;

    this.shoot = false;
    this.isAutoRotate = false;
    this.isMouseDown = false;

    this.mouseX = 0;
    this.mouseY = 0;

    this.upgrade = null;
  }
}

export const inputs = {}