import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";

export class InfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towerinfo", width_px, height_px, x, y)
    }

    onTowerMenuPointerOver(towerType) {
        console.log("Info toolbar tower menu pointer over", towerType)
    }
}