import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { KeyValueInfo } from "../ui_common/keyValueInfo.js"

export class GameInfoToolbar extends BaseToolbarComponent {
    constructor(width_px, height_px, x, y) {
        super("gameinfo", width_px, height_px, x, y)
        let xMargin = 10 // TODO set this in config somewhere

        this.lives = new KeyValueInfo("Lives", "100", width_px, xMargin, 20)
        this.addChild(this.lives)
    }

    update(worldStateData) {
        this.lives.setValue(worldStateData.lives)
    }
}