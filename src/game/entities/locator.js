import Phaser from "phaser";
import { state } from "../state";

export default class Locator extends Phaser.GameObjects.Container {

    constructor(scene, x, y, title) {
        const arrow = scene.add.image(0, 0, "arrow");
        super(scene, x, y, [arrow]);
        scene.add.existing(this);
        this.setScale(0.03);
        this.title = title;
        this.scene = scene;
        this.arrow = arrow;
        this.setDepth(9);
    }

    update(targetX, targetY) {
        const { newX, newY } = this.getOnscreenPosition(targetX, targetY);
        this.x = newX;
        this.y = newY;

        const angle = Phaser.Math.Angle.Between(
            state.game.player.x,
            state.game.player.y,
            targetX,
            targetY
        );

        if (state.game.player.id == state.game.topPlayer) this.setAlpha(0);
        else this.setAlpha(1);

        this.arrow.setRotation(angle);
    }

    getOnscreenPosition(targetX, targetY) {
        const playerX = state.game.player.x;
        const playerY = state.game.player.y;

        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;

        const screenX = targetX - playerX + innerWidth / 2;
        const screenY = targetY - playerY + innerHeight / 2;
        
        if (screenX >= 0 && screenX <= innerWidth && screenY >= 0 && screenY <= innerHeight) {
            return { newX: screenX, newY: screenY };
        }

        const dx = targetX - playerX;
        const dy = targetY - playerY;

        const angle = Math.atan2(dy, dx);

        const newX = playerX + Math.cos(angle) * 150;
        const newY = playerY + Math.sin(angle) * 150;

        return { newX, newY, angle };
    }
}