import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";

export class GameInfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "gameinfo", width_px, height_px, x, y)

        let xMargin = 20

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.width_px - xMargin
        }

        // TODO put this all in a function so can reposition if more info comes
        let livesName = new PIXI.Text("Lives", defaultStyle);
        livesName.x = Math.floor(xMargin)
        livesName.y = Math.floor(0)
        this.container.addChild(livesName);

        this.livesValue = new PIXI.Text("100", defaultStyle); // TODO get from config the starting lives value
        this.livesValue.x = Math.floor(this.width_px - xMargin)
        this.livesValue.y = Math.floor(0)
        this.livesValue.anchor.set(1, 0) // Shift right
        this.container.addChild(this.livesValue);
    }

    update(worldStateData) {
        this.livesValue.text = worldStateData.lives
    }
}